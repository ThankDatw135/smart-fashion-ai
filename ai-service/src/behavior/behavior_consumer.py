"""
Behavior Event Consumer — RabbitMQ listener cho behavior tracking.

Lắng nghe events từ Backend:
- user.behavior.tracked → Gom vào memory → Batch INSERT mỗi 5 phút

Exchange: behavior_events (TOPIC)
Queue: ai_behavior_queue (durable)
"""

import json
import logging
import asyncio
from datetime import datetime
from typing import Any

import aio_pika
from sqlalchemy import text

from src.shared.rabbitmq import bind_and_consume
from src.shared.database import async_session_maker

logger = logging.getLogger(__name__)

# In-memory buffer cho batch insert
_event_buffer: list[dict[str, Any]] = []
_buffer_lock = asyncio.Lock()
_BATCH_INTERVAL_SECONDS = 300  # 5 phút
_BATCH_SIZE_THRESHOLD = 100  # Hoặc khi đạt 100 events


async def handle_behavior_event(message: aio_pika.abc.AbstractIncomingMessage) -> None:
    """
    Xử lý event user.behavior.tracked.

    Message body expected:
        {
            "user_id": "uuid" | null,
            "guest_id": "browser-uuid",
            "event_type": "product_view" | "add_to_cart" | "checkout_start" | ...,
            "event_data": { "product_id": "...", "category_id": "...", "duration": 5 },
            "session_id": "browser-session-uuid"
        }

    Gom vào buffer → batch insert khi đủ threshold hoặc hết interval.
    """
    async with message.process():
        try:
            body = json.loads(message.body.decode("utf-8"))

            event = {
                "user_id": body.get("user_id") or body.get("userId"),
                "guest_id": body.get("guest_id") or body.get("guestId"),
                "event_type": body.get("event_type") or body.get("eventType", "unknown"),
                "event_data": json.dumps(body.get("event_data") or body.get("eventData", {})),
                "session_id": body.get("session_id") or body.get("sessionId"),
                "created_at": datetime.now().isoformat(),
            }

            async with _buffer_lock:
                _event_buffer.append(event)

                # Flush nếu đạt threshold
                if len(_event_buffer) >= _BATCH_SIZE_THRESHOLD:
                    await _flush_buffer()

        except json.JSONDecodeError:
            logger.error(f"Lỗi parse JSON behavior event: {message.body}")
        except Exception as e:
            logger.error(f"Lỗi xử lý behavior event: {e}")


async def _flush_buffer() -> None:
    """
    Batch INSERT toàn bộ buffer vào bảng behavior_events.

    Gọi khi đạt threshold hoặc interval timer.
    """
    global _event_buffer

    if not _event_buffer:
        return

    # Swap buffer để tránh lock lâu
    events_to_insert = _event_buffer[:]
    _event_buffer = []

    try:
        async with async_session_maker() as db:
            for event in events_to_insert:
                await db.execute(
                    text("""
                        INSERT INTO behavior_events
                            (id, user_id, guest_id, event_type, event_data, session_id, created_at)
                        VALUES
                            (gen_random_uuid(), :user_id, :guest_id, :event_type,
                             :event_data::jsonb, :session_id, :created_at::timestamp)
                    """),
                    event,
                )
            await db.commit()

        logger.info(f"✅ Batch inserted {len(events_to_insert)} behavior events")

    except Exception as e:
        logger.error(f"❌ Batch insert behavior events lỗi: {e}")
        # Đẩy events quay lại buffer để thử lại
        async with _buffer_lock:
            _event_buffer = events_to_insert + _event_buffer


async def _periodic_flush() -> None:
    """Background task: flush buffer mỗi 5 phút."""
    while True:
        await asyncio.sleep(_BATCH_INTERVAL_SECONDS)
        try:
            async with _buffer_lock:
                await _flush_buffer()
        except Exception as e:
            logger.error(f"Periodic flush lỗi: {e}")


async def start_behavior_consumer() -> None:
    """
    Đăng ký consumer cho behavior events + khởi chạy periodic flush.
    """
    try:
        await bind_and_consume(
            exchange_name="behavior_events",
            routing_key="user.behavior.tracked",
            queue_name="ai_behavior_queue",
            callback=handle_behavior_event,
        )

        # Khởi chạy background periodic flush
        asyncio.create_task(_periodic_flush())

        logger.info("✅ Behavior consumer đã đăng ký: user.behavior.tracked + periodic flush")

    except Exception as e:
        logger.error(f"❌ Không thể đăng ký behavior consumer: {e}")
