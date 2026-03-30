"""
Chat Router — API endpoints cho chatbot.

Phase 7: Tích hợp LangGraph agent + Gemini API.
- POST /api/chat → SSE StreamingResponse
- GET /api/chat/history/{session_id} → Lịch sử chat
- DELETE /api/chat/history/{session_id} → Xóa lịch sử

SSE Format (đã duyệt):
    data: {"type": "text", "content": "Xin chào!"}
    data: {"type": "product_cards", "products": [...]}
    data: {"type": "done"}
"""

import json
import logging
import asyncio
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.dependencies import get_db_session
from src.shared.schemas import (
    ChatMessageRequest,
    ChatHistoryResponse,
    ChatHistoryItem,
)
from src.shared.exceptions import SessionNotFoundError
from src.chatbot.memory import chat_memory
from src.chatbot.agent import run_agent, FALLBACK_MESSAGE

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["Chat"])


async def _sse_generator(
    request: ChatMessageRequest,
):
    """
    Generator cho Server-Sent Events (SSE).

    Luồng:
    1. Tạo/lấy session
    2. Lưu tin nhắn user
    3. Chạy agent pipeline
    4. Stream kết quả về client theo từng chunk
    5. Lưu response vào memory
    """
    # 1. Tạo session mới nếu chưa có
    session_id = request.session_id
    if not session_id:
        session_id = await chat_memory.create_session(user_id=request.user_id)

    # Gửi session_id trước
    yield f"data: {json.dumps({'type': 'session', 'session_id': session_id}, ensure_ascii=False)}\n\n"

    # 2. Lưu tin nhắn user
    await chat_memory.save_message(session_id, "user", request.message)

    # 3. Load chat history cho context
    chat_history = await chat_memory.build_context(session_id, request.message)

    # 4. Chạy agent (LangGraph pipeline)
    try:
        result = await run_agent(
            user_message=request.message,
            session_id=session_id,
            user_id=request.user_id,
            chat_history=chat_history[:-1],  # Bỏ tin nhắn cuối (đã có trong user_message)
        )

        response_text = result["response_text"]
        response_type = result["response_type"]
        products = result.get("products")

        # 5. Stream response text theo từng đoạn
        # Chia text thành các chunks nhỏ (~100 ký tự) để giả lập streaming
        if response_text:
            chunks = _split_text_chunks(response_text)
            for chunk in chunks:
                event = {"type": "text", "content": chunk}
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
                await asyncio.sleep(0.05)  # Độ trễ nhỏ giữa các chunk

        # Stream product cards nếu có
        if products:
            event = {"type": "product_cards", "products": products}
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

        # 6. Lưu response vào memory
        await chat_memory.save_message(session_id, "assistant", response_text)

        # Log intent cho analytics
        logger.info(
            f"Chat completed | session={session_id} | "
            f"intent={result.get('intent')} | tool={result.get('tool_used')}"
        )

    except Exception as e:
        logger.error(f"Agent pipeline error: {e}")
        # Fallback response
        event = {"type": "text", "content": FALLBACK_MESSAGE}
        yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
        await chat_memory.save_message(session_id, "assistant", FALLBACK_MESSAGE)

    # Kết thúc stream
    yield f"data: {json.dumps({'type': 'done'}, ensure_ascii=False)}\n\n"


def _split_text_chunks(text: str, max_chunk_size: int = 100) -> list[str]:
    """
    Chia text thành các chunks nhỏ để stream.

    Ưu tiên cắt tại dấu xuống dòng, dấu chấm, dấu phẩy.
    Tránh cắt giữa từ.
    """
    if len(text) <= max_chunk_size:
        return [text]

    chunks = []
    remaining = text

    while remaining:
        if len(remaining) <= max_chunk_size:
            chunks.append(remaining)
            break

        # Tìm vị trí cut tốt nhất
        cut_pos = max_chunk_size
        for delimiter in ["\n", ". ", ", ", " "]:
            pos = remaining.rfind(delimiter, 0, max_chunk_size)
            if pos > max_chunk_size // 2:  # Không cut quá ngắn
                cut_pos = pos + len(delimiter)
                break

        chunks.append(remaining[:cut_pos])
        remaining = remaining[cut_pos:]

    return chunks


@router.post("")
async def chat(request: ChatMessageRequest):
    """
    Gửi tin nhắn tới Fashion AI chatbot.

    Trả về SSE stream với các event types:
    - session: {"type": "session", "session_id": "..."}
    - text: {"type": "text", "content": "..."}
    - product_cards: {"type": "product_cards", "products": [...]}
    - done: {"type": "done"}

    Khi Gemini API lỗi, tự động fallback trả về câu trả lời cố định.
    """
    return StreamingResponse(
        _sse_generator(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Nginx: tắt buffering cho SSE
        },
    )


@router.get("/history/{session_id}", response_model=ChatHistoryResponse)
async def get_chat_history(session_id: str):
    """
    Lấy lịch sử chat theo session_id.

    Ưu tiên lấy từ Redis (nhanh), fallback PostgreSQL nếu cache miss.
    """
    session_info = await chat_memory.get_session_info(session_id)
    if not session_info:
        raise SessionNotFoundError(session_id)

    messages = await chat_memory.load_history(session_id)

    return ChatHistoryResponse(
        session_id=session_id,
        messages=[
            ChatHistoryItem(
                role=msg["role"],
                content=msg["content"],
                timestamp=msg.get("timestamp", ""),
            )
            for msg in messages
        ],
        total=len(messages),
    )


@router.delete("/history/{session_id}")
async def clear_chat_history(session_id: str):
    """
    Xóa lịch sử chat của session.

    Xóa cả Redis cache và đánh dấu session inactive trong DB.
    """
    session_info = await chat_memory.get_session_info(session_id)
    if not session_info:
        raise SessionNotFoundError(session_id)

    await chat_memory.clear_history(session_id)

    return {
        "message": f"Đã xóa lịch sử chat session: {session_id}",
        "session_id": session_id,
    }
