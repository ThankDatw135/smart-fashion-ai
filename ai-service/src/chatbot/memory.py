"""
Chat Memory 2 lớp — quản lý lịch sử hội thoại.

Kiến trúc:
- L1 (Redis): Cache nhanh, TTL 1 giờ, tối đa 50 messages/session
- L2 (PostgreSQL): Lưu trữ vĩnh viễn, dùng khi Redis miss

Flow hoạt động:
1. Load history: Thử Redis trước → Nếu miss → Fallback DB
2. Save message: Push vào Redis (đồng bộ) + INSERT DB (nền)
3. Sliding window: Giữ 50 messages gần nhất trong Redis

Ghi chú: Session được quản lý qua bảng chat_sessions
và chat_messages trong PostgreSQL (đã định nghĩa ở Backend Prisma).
"""

import uuid
import logging
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.shared.redis_client import (
    redis_get,
    redis_set,
    redis_lpush,
    redis_lrange,
    redis_ltrim,
    redis_delete,
)
from src.shared.database import async_session_maker

logger = logging.getLogger(__name__)

# Prefix cho Redis keys — tránh conflict với các module khác
_REDIS_CHAT_PREFIX = "chat:history:"
_REDIS_SESSION_PREFIX = "chat:session:"


class ChatMemory:
    """
    Quản lý lịch sử chat 2 lớp (Redis L1 + PostgreSQL L2).

    Sử dụng:
        memory = ChatMemory()
        session_id = await memory.create_session(user_id="abc123")
        await memory.save_message(session_id, "user", "Xin chào!")
        history = await memory.load_history(session_id)
        context = await memory.build_context(session_id, "Tìm áo thun nam")
    """

    # ─── Quản lý Session ───

    async def create_session(
        self, user_id: str | None = None, guest_id: str | None = None
    ) -> str:
        """
        Tạo phiên chat mới.

        Nếu user đã đăng nhập → user_id, ngược lại → guest_id.
        Trả về session_id (UUID).
        """
        session_id = str(uuid.uuid4())

        # Lưu metadata session vào Redis (TTL ngắn, quick access)
        session_data = {
            "session_id": session_id,
            "user_id": user_id,
            "guest_id": guest_id or str(uuid.uuid4()),
            "created_at": datetime.now().isoformat(),
            "message_count": 0,
        }
        await redis_set(
            f"{_REDIS_SESSION_PREFIX}{session_id}",
            session_data,
            ttl=settings.CHAT_HISTORY_REDIS_TTL,
        )

        # Lưu vào PostgreSQL (persistent)
        try:
            async with async_session_maker() as db:
                await db.execute(
                    text("""
                        INSERT INTO chat_sessions (id, user_id, started_at, is_active)
                        VALUES (:id, :user_id, NOW(), true)
                    """),
                    {
                        "id": session_id,
                        "user_id": user_id,
                    },
                )
                await db.commit()
            logger.info(f"Đã tạo chat session: {session_id}")
        except Exception as e:
            # Redis đã lưu, DB fail thì log warning nhưng không crash
            logger.warning(f"Không thể lưu session vào DB: {e}")

        return session_id

    async def get_session_info(self, session_id: str) -> dict | None:
        """Lấy metadata session từ Redis, fallback DB."""
        # Thử Redis trước
        data = await redis_get(f"{_REDIS_SESSION_PREFIX}{session_id}")
        if data:
            return data

        # Fallback: query DB
        try:
            async with async_session_maker() as db:
                result = await db.execute(
                    text("SELECT id, user_id, started_at, is_active FROM chat_sessions WHERE id = :id"),
                    {"id": session_id},
                )
                row = result.mappings().first()
                if row:
                    session_data = {
                        "session_id": row["id"],
                        "user_id": row["user_id"],
                        "created_at": str(row["started_at"]),
                    }
                    # Cache lại vào Redis
                    await redis_set(
                        f"{_REDIS_SESSION_PREFIX}{session_id}",
                        session_data,
                        ttl=settings.CHAT_HISTORY_REDIS_TTL,
                    )
                    return session_data
        except Exception as e:
            logger.error(f"Không thể lấy session info từ DB: {e}")

        return None

    # ─── Lưu & Đọc tin nhắn ───

    async def save_message(self, session_id: str, role: str, content: str):
        """
        Lưu tin nhắn vào cả Redis (L1) và PostgreSQL (L2).

        Redis: Push vào đầu list → sliding window 50 messages
        DB: INSERT vào bảng chat_messages
        """
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
        }

        redis_key = f"{_REDIS_CHAT_PREFIX}{session_id}"

        # L1: Lưu vào Redis
        try:
            await redis_lpush(redis_key, message)
            # Sliding window: giữ tối đa 50 messages gần nhất
            await redis_ltrim(redis_key, 0, settings.CHAT_MAX_MESSAGES - 1)
        except Exception as e:
            logger.warning(f"Không thể lưu message vào Redis: {e}")

        # L2: Lưu vào PostgreSQL (background — không block response)
        try:
            async with async_session_maker() as db:
                await db.execute(
                    text("""
                        INSERT INTO chat_messages (id, session_id, role, content, created_at)
                        VALUES (:id, :session_id, :role, :content, NOW())
                    """),
                    {
                        "id": str(uuid.uuid4()),
                        "session_id": session_id,
                        "role": role,
                        "content": content,
                    },
                )
                await db.commit()
        except Exception as e:
            logger.warning(f"Không thể lưu message vào DB: {e}")

    async def load_history(self, session_id: str, limit: int = 50) -> list[dict]:
        """
        Load lịch sử chat, ưu tiên Redis → fallback DB.

        Trả về danh sách messages sắp xếp theo thời gian (cũ → mới).
        """
        redis_key = f"{_REDIS_CHAT_PREFIX}{session_id}"

        # Thử Redis trước (nhanh ~1ms)
        try:
            messages = await redis_lrange(redis_key, 0, limit - 1)
            if messages:
                # Redis lưu ngược (mới nhất ở đầu), cần đảo lại
                messages.reverse()
                logger.debug(f"Redis HIT: {len(messages)} messages cho session {session_id}")
                return messages
        except Exception as e:
            logger.warning(f"Redis load thất bại: {e}")

        # Fallback: Query DB (chậm hơn ~10-50ms)
        try:
            async with async_session_maker() as db:
                result = await db.execute(
                    text("""
                        SELECT role, content, created_at
                        FROM chat_messages
                        WHERE session_id = :session_id
                        ORDER BY created_at ASC
                        LIMIT :limit
                    """),
                    {"session_id": session_id, "limit": limit},
                )
                rows = result.mappings().all()
                messages = [
                    {
                        "role": row["role"],
                        "content": row["content"],
                        "timestamp": str(row["created_at"]),
                    }
                    for row in rows
                ]

                # Cache lại vào Redis cho lần sau
                if messages:
                    for msg in reversed(messages):  # lpush nên cần đảo
                        await redis_lpush(redis_key, msg)
                    await redis_ltrim(redis_key, 0, settings.CHAT_MAX_MESSAGES - 1)

                logger.debug(f"DB Fallback: {len(messages)} messages cho session {session_id}")
                return messages
        except Exception as e:
            logger.error(f"Không thể load chat history từ DB: {e}")
            return []

    async def clear_history(self, session_id: str):
        """Xóa lịch sử chat của session (cả Redis và DB)."""
        redis_key = f"{_REDIS_CHAT_PREFIX}{session_id}"

        # Xóa Redis
        await redis_delete(redis_key)
        await redis_delete(f"{_REDIS_SESSION_PREFIX}{session_id}")

        # Cập nhật DB: đánh dấu session inactive
        try:
            async with async_session_maker() as db:
                await db.execute(
                    text("UPDATE chat_sessions SET is_active = false WHERE id = :id"),
                    {"id": session_id},
                )
                await db.commit()
            logger.info(f"Đã xóa lịch sử chat session: {session_id}")
        except Exception as e:
            logger.warning(f"Không thể cập nhật session trong DB: {e}")

    # ─── Build LLM Context ───

    async def build_context(
        self, session_id: str, new_message: str
    ) -> list[dict]:
        """
        Xây dựng context cho LLM từ lịch sử chat.

        Cấu trúc context (tối đa ~8000 tokens):
        1. System prompt (~800 tokens) — thêm bên ngoài
        2. Few-shot examples 3 cái (~600 tokens) — thêm bên ngoài
        3. Lịch sử chat sliding window (20 messages gần nhất)
        4. Tin nhắn mới từ user

        Nếu lịch sử quá dài (> ~4000 tokens) → chỉ giữ 10 messages.
        """
        # Lấy lịch sử từ Redis/DB
        history = await self.load_history(session_id, limit=20)

        # Ước tính tokens thô (1 token ≈ 4 ký tự tiếng Việt)
        total_chars = sum(len(m.get("content", "")) for m in history)
        estimated_tokens = total_chars // 4

        # Nếu quá dài, cắt bớt chỉ giữ 10 messages gần nhất
        if estimated_tokens > 4000:
            history = history[-10:]
            logger.debug(f"Cắt bớt history còn 10 messages (est: {estimated_tokens} tokens)")

        # Chuyển thành format LLM messages
        context_messages = []
        for msg in history:
            context_messages.append({
                "role": msg["role"],
                "content": msg["content"],
            })

        # Thêm tin nhắn mới
        context_messages.append({
            "role": "user",
            "content": new_message,
        })

        return context_messages


# ─── Module-level singleton ───
chat_memory = ChatMemory()
