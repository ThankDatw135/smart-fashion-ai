"""
Celery App — Background task scheduler.

Tasks:
- retrain_recommendations: 2:00 AM daily
- batch_reindex_embeddings: 2:30 AM daily

Broker: Redis (db=2)
Worker command: celery -A src.celery_app worker --beat --loglevel=info
"""

import asyncio
import logging
from celery import Celery
from celery.schedules import crontab

from src.config import settings

logger = logging.getLogger(__name__)

# Celery app
celery_app = Celery(
    "smart_fashion_ai",
    broker=settings.CELERY_BROKER_URL,
)

# Configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Ho_Chi_Minh",
    enable_utc=False,

    # Beat schedule — nightly jobs
    beat_schedule={
        "retrain-recommendations": {
            "task": "src.celery_app.retrain_recommendations",
            "schedule": crontab(
                hour=settings.RECOMMENDATION_RETRAIN_HOUR,
                minute=0,
            ),
        },
        "batch-reindex-embeddings": {
            "task": "src.celery_app.batch_reindex_embeddings",
            "schedule": crontab(
                hour=settings.RECOMMENDATION_RETRAIN_HOUR,
                minute=30,
            ),
        },
    },
)


def _run_async(coro):
    """Helper: chạy async function trong sync Celery task."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="src.celery_app.retrain_recommendations")
def retrain_recommendations():
    """
    Celery task: Huấn luyện lại recommendation model.

    Chạy lúc 2:00 AM daily.
    """
    logger.info("🔄 Celery task: retrain_recommendations bắt đầu...")

    try:
        from src.recommendation.recommendation_trainer import retrain_all
        result = _run_async(retrain_all())
        logger.info(f"✅ Retrain hoàn tất: {result}")
        return result
    except Exception as e:
        logger.error(f"❌ Retrain lỗi: {e}")
        return {"error": str(e)}


@celery_app.task(name="src.celery_app.batch_reindex_embeddings")
def batch_reindex_embeddings():
    """
    Celery task: Re-index toàn bộ product embeddings.

    Chạy lúc 2:30 AM daily.
    """
    logger.info("🔄 Celery task: batch_reindex_embeddings bắt đầu...")

    try:
        from src.search.embedding_service import embedding_service

        # Warmup model nếu chưa
        if not embedding_service.is_ready:
            _run_async(embedding_service.warmup())

        result = _run_async(embedding_service.batch_reindex())
        logger.info(f"✅ Batch reindex hoàn tất: {result}")
        return result
    except Exception as e:
        logger.error(f"❌ Batch reindex lỗi: {e}")
        return {"error": str(e)}
