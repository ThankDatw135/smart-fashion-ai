"""
FastAPI Main Application — Entry Point.

Quản lý:
- Lifespan (startup/shutdown): Khởi tạo DB, Redis, RabbitMQ, Knowledge Base
- CORS middleware
- Exception handlers (RFC 7807)
- Router registration
- Swagger UI tại /docs
"""

import time
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.shared.database import init_db, close_db, check_db_connection
from src.shared.redis_client import init_redis, close_redis, check_redis_connection
from src.shared.rabbitmq import init_rabbitmq, close_rabbitmq, check_rabbitmq_connection
from src.shared.exceptions import AIServiceError, ai_service_error_handler, generic_error_handler
from src.shared.schemas import HealthResponse, ConnectionStatus, KnowledgeStatus
from src.knowledge.loader import knowledge_base
from src.chatbot.router import router as chat_router

# Phase 8: AI Search, Recommendation, Behavior Analytics
from src.search.search_router import router as search_router
from src.recommendation.recommendation_router import router as recommendation_router
from src.behavior.behavior_router import router as behavior_router
from src.search.embedding_service import embedding_service

# Cấu hình logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("ai-service")

# Biến toàn cục: thời điểm khởi động server
_start_time: float = 0.0


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Quản lý vòng đời ứng dụng.

    Startup: Khởi tạo tất cả kết nối + load knowledge
    Shutdown: Đóng tất cả kết nối gracefully
    """
    global _start_time
    _start_time = time.time()

    logger.info("🚀 Đang khởi động AI Service...")

    # 1. Khởi tạo Database (PostgreSQL + pgvector)
    try:
        await init_db()
        logger.info("✅ Database: Đã kết nối PostgreSQL + pgvector")
    except Exception as e:
        logger.error(f"❌ Database: Kết nối thất bại — {e}")

    # 2. Khởi tạo Redis
    try:
        await init_redis()
        logger.info("✅ Redis: Đã kết nối")
    except Exception as e:
        logger.error(f"❌ Redis: Kết nối thất bại — {e}")

    # 3. Khởi tạo RabbitMQ
    try:
        await init_rabbitmq()
        logger.info("✅ RabbitMQ: Đã kết nối + khai báo exchanges")
    except Exception as e:
        logger.error(f"❌ RabbitMQ: Kết nối thất bại — {e}")

    # 4. Load Knowledge Base
    try:
        knowledge_base.load_all()
        logger.info(f"✅ Knowledge Base: Đã load {knowledge_base.loaded_files_count} files")
    except Exception as e:
        logger.error(f"❌ Knowledge Base: Load thất bại — {e}")

    # 5. Phase 8: Warmup Embedding Model (~30s lần đầu)
    try:
        await embedding_service.warmup()
        logger.info("✅ Embedding Model: Đã sẵn sàng")
    except Exception as e:
        logger.error(f"⚠️ Embedding Model: Warmup thất bại (search vẫn dùng SQL) — {e}")

    # 6. Phase 8: Tạo bảng search_logs (Phương án A — AI Service tự quản lý)
    try:
        from src.shared.database import async_session_maker
        from sqlalchemy import text as sa_text
        async with async_session_maker() as db:
            await db.execute(sa_text("""
                CREATE TABLE IF NOT EXISTS search_logs (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    keyword VARCHAR(255) NOT NULL,
                    results_count INT DEFAULT 0,
                    user_id UUID,
                    session_id VARCHAR(100),
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """))
            await db.execute(sa_text("""
                CREATE INDEX IF NOT EXISTS idx_search_logs_keyword ON search_logs(keyword)
            """))
            await db.execute(sa_text("""
                CREATE INDEX IF NOT EXISTS idx_search_logs_created ON search_logs(created_at)
            """))
            await db.commit()
        logger.info("✅ Search Logs: Bảng đã sẵn sàng")
    except Exception as e:
        logger.error(f"⚠️ Search Logs: Tạo bảng thất bại — {e}")

    # 7. Phase 8: Đăng ký RabbitMQ Consumers
    try:
        from src.search.product_consumer import start_product_consumer
        from src.behavior.behavior_consumer import start_behavior_consumer
        await start_product_consumer()
        await start_behavior_consumer()
        logger.info("✅ RabbitMQ Consumers: product_events + behavior_events")
    except Exception as e:
        logger.error(f"⚠️ RabbitMQ Consumers: Đăng ký thất bại — {e}")

    logger.info(f"🎉 AI Service đã sẵn sàng tại http://{settings.HOST}:{settings.PORT}")
    logger.info(f"📖 Swagger UI: http://localhost:{settings.PORT}/docs")

    yield  # ← App đang chạy

    # Shutdown: đóng kết nối
    logger.info("🛑 Đang tắt AI Service...")
    await close_redis()
    await close_rabbitmq()
    await close_db()
    logger.info("👋 AI Service đã tắt hoàn toàn.")


# ─── Khởi tạo FastAPI app ───

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "AI Service cho Smart Fashion Store — "
        "Chatbot thông minh, AI Search, Recommendation, Behavior Analytics."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─── Middleware ───

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Exception Handlers ───

app.add_exception_handler(AIServiceError, ai_service_error_handler)
app.add_exception_handler(Exception, generic_error_handler)

# ─── Routers ───

app.include_router(chat_router)
app.include_router(search_router)
app.include_router(recommendation_router)
app.include_router(behavior_router)


# ─── Health Check ───

@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Kiểm tra sức khỏe toàn bộ AI Service.

    Trả về trạng thái kết nối tới: Database, Redis, RabbitMQ
    và trạng thái Knowledge Base.
    """
    # Kiểm tra từng service
    db_ok = await check_db_connection()
    redis_ok = await check_redis_connection()
    rabbitmq_ok = await check_rabbitmq_connection()

    connections = ConnectionStatus(
        database="connected" if db_ok else "disconnected",
        redis="connected" if redis_ok else "disconnected",
        rabbitmq="connected" if rabbitmq_ok else "disconnected",
    )

    knowledge_status = KnowledgeStatus(
        loaded=knowledge_base.is_loaded,
        files=knowledge_base.loaded_files_count,
    )

    # Trạng thái tổng thể: OK nếu ít nhất DB kết nối được
    overall_status = "ok" if db_ok else "degraded"

    # Phase 8: Thêm trạng thái embedding model
    embedding_status = "ready" if embedding_service.is_ready else "not_loaded"

    return HealthResponse(
        status=overall_status,
        service="ai-service",
        version=settings.APP_VERSION,
        uptime_seconds=round(time.time() - _start_time, 1),
        connections=connections,
        knowledge_base=knowledge_status,
        embedding_model=embedding_status,
    )


# ─── Root endpoint ───

@app.get("/", tags=["Root"])
async def root():
    """Endpoint gốc — redirect tới docs."""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/api/health",
    }
