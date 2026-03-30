"""
Module kết nối Database PostgreSQL (asyncpg + pgvector).

Sử dụng SQLAlchemy async engine để quản lý connection pool.
Tích hợp pgvector extension cho vector search.
"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text
import logging

from src.config import settings

logger = logging.getLogger(__name__)

# Khởi tạo async engine với connection pool
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    echo=settings.DEBUG,
)

# Tạo session maker — dùng cho dependency injection
async_session_maker = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency injection: cung cấp async DB session cho mỗi request."""
    async with async_session_maker() as session:
        yield session


async def check_db_connection() -> bool:
    """Kiểm tra kết nối database còn sống không."""
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Kết nối database thất bại: {e}")
        return False


async def init_db():
    """Khởi tạo database extensions (pgvector) nếu chưa có."""
    try:
        async with engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            logger.info("Đã kiểm tra/tạo pgvector extension thành công.")
    except Exception as e:
        logger.error(f"Khởi tạo database extensions thất bại: {e}")


async def close_db():
    """Đóng kết nối database engine — gọi khi shutdown."""
    await engine.dispose()
    logger.info("Đã đóng kết nối database.")
