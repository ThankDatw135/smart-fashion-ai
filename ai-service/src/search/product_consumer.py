"""
Product Event Consumer — RabbitMQ listener cho embedding pipeline.

Lắng nghe events từ Backend:
- product.created → Tạo embedding mới
- product.updated → Cập nhật embedding

Exchange: product_events (TOPIC)
Queue: ai_product_embedding_queue (durable)
"""

import json
import logging
import aio_pika

from src.shared.rabbitmq import bind_and_consume
from src.search.embedding_service import embedding_service

logger = logging.getLogger(__name__)


async def handle_product_event(message: aio_pika.abc.AbstractIncomingMessage) -> None:
    """
    Xử lý event product.created hoặc product.updated.

    Message body expected:
        { "product_id": "uuid-string", "event": "created|updated" }

    Flow:
        1. Parse message body
        2. Kiểm tra embedding service sẵn sàng
        3. Gọi index_product() để generate + upsert embedding
        4. ACK message
    """
    async with message.process():
        try:
            body = json.loads(message.body.decode("utf-8"))
            product_id = body.get("product_id") or body.get("productId")
            event_type = body.get("event", "unknown")

            if not product_id:
                logger.warning(f"Product event thiếu product_id: {body}")
                return

            logger.info(f"📥 Product event: {event_type} → product_id={product_id}")

            # Kiểm tra embedding model sẵn sàng
            if not embedding_service.is_ready:
                logger.warning(
                    f"Embedding model chưa sẵn sàng, bỏ qua event {event_type} "
                    f"cho product {product_id}"
                )
                return

            # Generate + upsert embedding
            success = await embedding_service.index_product(product_id)

            if success:
                logger.info(f"✅ Embedding indexed cho product {product_id} (event: {event_type})")
            else:
                logger.warning(f"⚠️ Không thể index product {product_id} (event: {event_type})")

        except json.JSONDecodeError:
            logger.error(f"Lỗi parse JSON product event: {message.body}")
        except Exception as e:
            logger.error(f"Lỗi xử lý product event: {e}")


async def start_product_consumer() -> None:
    """
    Đăng ký consumer cho product events.

    Bind 2 routing keys:
    - product.created → tạo embedding mới
    - product.updated → cập nhật embedding
    """
    try:
        # Consumer cho product.created
        await bind_and_consume(
            exchange_name="product_events",
            routing_key="product.created",
            queue_name="ai_product_embedding_queue",
            callback=handle_product_event,
        )

        # Consumer cho product.updated — cùng queue (fan-out từ exchange)
        await bind_and_consume(
            exchange_name="product_events",
            routing_key="product.updated",
            queue_name="ai_product_embedding_queue",
            callback=handle_product_event,
        )

        logger.info("✅ Product consumer đã đăng ký: product.created + product.updated")

    except Exception as e:
        logger.error(f"❌ Không thể đăng ký product consumer: {e}")
