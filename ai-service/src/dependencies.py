"""
Dependency Injection container cho AI Service.

Cung cấp các dependencies dùng chung cho FastAPI routes:
- Database session (AsyncSession)
- Redis client
- Settings singleton
- Knowledge Base (singleton, load 1 lần)
"""

from functools import lru_cache
from sqlalchemy.ext.asyncio import AsyncSession
from typing import AsyncGenerator

from src.config import Settings
from src.shared.database import async_session_maker
from src.shared.redis_client import get_redis


@lru_cache()
def get_settings() -> Settings:
    """Trả về Settings singleton — cache bằng lru_cache."""
    return Settings()


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency: cung cấp async DB session cho mỗi request.

    Sử dụng: @router.get("/")
              async def endpoint(db: AsyncSession = Depends(get_db_session)):
    """
    async with async_session_maker() as session:
        yield session


def get_redis_client():
    """
    Dependency: cung cấp Redis client instance.

    Sử dụng: @router.get("/")
              async def endpoint(redis = Depends(get_redis_client)):
    """
    return get_redis()
