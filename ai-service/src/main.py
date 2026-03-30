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

    return HealthResponse(
        status=overall_status,
        service="ai-service",
        version=settings.APP_VERSION,
        uptime_seconds=round(time.time() - _start_time, 1),
        connections=connections,
        knowledge_base=knowledge_status,
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
