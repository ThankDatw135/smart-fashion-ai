"""
Chat Router — API endpoints cho chatbot.

Phase 6: Placeholder — trả về hardcoded response.
Phase 7: Sẽ tích hợp LangGraph agent + Gemini API.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.dependencies import get_db_session
from src.shared.schemas import (
    ChatMessageRequest,
    ChatHistoryResponse,
    ChatHistoryItem,
)
from src.shared.exceptions import SessionNotFoundError
from src.chatbot.memory import chat_memory

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("")
async def chat(
    request: ChatMessageRequest,
    db: AsyncSession = Depends(get_db_session),
):
    """
    Gửi tin nhắn tới chatbot.

    Phase 6 (hiện tại): Trả về hardcoded response.
    Phase 7: Sẽ tích hợp LangGraph + Gemini để trả lời thông minh.
    """
    # Tạo session mới nếu chưa có
    session_id = request.session_id
    if not session_id:
        session_id = await chat_memory.create_session(
            user_id=request.user_id
        )

    # Lưu tin nhắn của user
    await chat_memory.save_message(session_id, "user", request.message)

    # Placeholder response — sẽ thay bằng LLM ở Phase 7
    assistant_response = (
        f"Xin chào! 👋 Mình là Fashion AI — trợ lý thời trang của Smart Fashion Store.\n\n"
        f"Bạn vừa nói: \"{request.message}\"\n\n"
        f"⚠️ Mình đang trong giai đoạn phát triển (Phase 6 — Foundation).\n"
        f"Tính năng trả lời thông minh sẽ có ở Phase 7! 🚀\n\n"
        f"Hiện tại bạn có thể thử:\n"
        f"- Kiểm tra lịch sử chat: GET /api/chat/history/{session_id}\n"
        f"- Xóa lịch sử: DELETE /api/chat/history/{session_id}"
    )

    # Lưu response của assistant
    await chat_memory.save_message(session_id, "assistant", assistant_response)

    return {
        "session_id": session_id,
        "message": assistant_response,
        "type": "text",
    }


@router.get("/history/{session_id}", response_model=ChatHistoryResponse)
async def get_chat_history(session_id: str):
    """
    Lấy lịch sử chat theo session_id.

    Ưu tiên lấy từ Redis (nhanh), fallback PostgreSQL nếu cache miss.
    """
    # Kiểm tra session tồn tại
    session_info = await chat_memory.get_session_info(session_id)
    if not session_info:
        raise SessionNotFoundError(session_id)

    # Load lịch sử
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
