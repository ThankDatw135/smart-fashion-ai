"""
Module RabbitMQ consumer (aio-pika).

Quản lý kết nối và lắng nghe sự kiện từ Backend:
- product_events: sản phẩm tạo/cập nhật → cập nhật embedding
- order_events: đơn hàng hoàn thành → cập nhật recommendation
- behavior_events: hành vi người dùng → phân tích & gợi ý
"""

import aio_pika
import logging
from typing import Callable, Awaitable

from src.config import settings

logger = logging.getLogger(__name__)

# Module-level connection — khởi tạo 1 lần
_connection: aio_pika.abc.AbstractRobustConnection | None = None
_channel: aio_pika.abc.AbstractChannel | None = None


async def init_rabbitmq():
    """
    Khởi tạo kết nối RabbitMQ và khai báo exchanges/queues.

    Exchanges (topic type):
    - product_events: routing keys product.created, product.updated
    - order_events: routing key order.completed
    - behavior_events: routing key user.behavior.tracked
    """
    global _connection, _channel

    _connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
    _channel = await _connection.channel()

    # Giới hạn prefetch để tránh quá tải consumer
    await _channel.set_qos(prefetch_count=10)

    # Khai báo exchanges
    for exchange_name in ["product_events", "order_events", "behavior_events"]:
        await _channel.declare_exchange(
            exchange_name, aio_pika.ExchangeType.TOPIC, durable=True
        )

    logger.info("Đã khởi tạo kết nối RabbitMQ và khai báo exchanges thành công.")


async def bind_and_consume(
    exchange_name: str,
    routing_key: str,
    queue_name: str,
    callback: Callable[[aio_pika.abc.AbstractIncomingMessage], Awaitable[None]],
):
    """
    Bind queue vào exchange theo routing key và bắt đầu consume.

    Ví dụ:
        await bind_and_consume(
            "product_events",
            "product.created",
            "ai_product_created_queue",
            handle_product_created
        )
    """
    if _channel is None:
        raise RuntimeError("RabbitMQ chưa được khởi tạo. Gọi init_rabbitmq() trước.")

    # Khai báo queue (durable để không mất message khi restart)
    queue = await _channel.declare_queue(queue_name, durable=True)

    # Lấy exchange đã khai báo
    exchange = await _channel.get_exchange(exchange_name)

    # Bind queue vào exchange theo routing key
    await queue.bind(exchange, routing_key=routing_key)

    # Bắt đầu consume — callback xử lý từng message
    await queue.consume(callback)

    logger.info(
        f"Đã bind queue '{queue_name}' vào exchange '{exchange_name}' "
        f"với routing key '{routing_key}' và bắt đầu consume."
    )


async def check_rabbitmq_connection() -> bool:
    """Kiểm tra kết nối RabbitMQ còn sống không."""
    try:
        if _connection and not _connection.is_closed:
            return True
        return False
    except Exception as e:
        logger.error(f"Kết nối RabbitMQ thất bại: {e}")
        return False


async def close_rabbitmq():
    """Đóng kết nối RabbitMQ — gọi khi shutdown."""
    global _connection, _channel
    if _connection and not _connection.is_closed:
        await _connection.close()
        _connection = None
        _channel = None
        logger.info("Đã đóng kết nối RabbitMQ.")
