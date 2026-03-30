"""
Module Redis async client wrapper.

Bọc lại redis-py async với các tiện ích:
- Tự động serialize/deserialize JSON (dùng orjson cho tốc độ)
- Quản lý connection pool
- Hỗ trợ list operations cho chat history (lpush, lrange, ltrim)
"""

import orjson
import redis.asyncio as aioredis
import logging
from typing import Any

from src.config import settings

logger = logging.getLogger(__name__)

# Module-level client — khởi tạo 1 lần, dùng xuyên suốt app
_redis_client: aioredis.Redis | None = None


async def init_redis() -> aioredis.Redis:
    """Khởi tạo Redis client với connection pool."""
    global _redis_client
    _redis_client = aioredis.from_url(
        settings.REDIS_URL,
        decode_responses=False,  # Giữ bytes để orjson xử lý
        max_connections=20,
    )
    logger.info("Đã khởi tạo Redis client thành công.")
    return _redis_client


def get_redis() -> aioredis.Redis:
    """Lấy Redis client instance — phải gọi init_redis() trước."""
    if _redis_client is None:
        raise RuntimeError("Redis chưa được khởi tạo. Gọi init_redis() trước.")
    return _redis_client


async def close_redis():
    """Đóng kết nối Redis — gọi khi shutdown."""
    global _redis_client
    if _redis_client:
        await _redis_client.close()
        _redis_client = None
        logger.info("Đã đóng kết nối Redis.")


async def check_redis_connection() -> bool:
    """Kiểm tra kết nối Redis còn sống không."""
    try:
        client = get_redis()
        return await client.ping()
    except Exception as e:
        logger.error(f"Kết nối Redis thất bại: {e}")
        return False


# ─── Các hàm tiện ích thao tác Redis ───


async def redis_get(key: str) -> Any | None:
    """Lấy giá trị từ Redis, tự động deserialize JSON."""
    client = get_redis()
    value = await client.get(key)
    if value is None:
        return None
    try:
        return orjson.loads(value)
    except orjson.JSONDecodeError:
        # Nếu không phải JSON, trả về string
        return value.decode("utf-8") if isinstance(value, bytes) else value


async def redis_set(key: str, value: Any, ttl: int | None = None):
    """Lưu giá trị vào Redis, tự động serialize JSON."""
    client = get_redis()
    serialized = orjson.dumps(value)
    if ttl:
        await client.set(key, serialized, ex=ttl)
    else:
        await client.set(key, serialized)


async def redis_delete(key: str):
    """Xóa key khỏi Redis."""
    client = get_redis()
    await client.delete(key)


async def redis_lpush(key: str, value: Any):
    """Thêm phần tử vào đầu list (dùng cho chat history)."""
    client = get_redis()
    serialized = orjson.dumps(value)
    await client.lpush(key, serialized)


async def redis_lrange(key: str, start: int = 0, stop: int = -1) -> list[Any]:
    """Lấy range phần tử từ list (dùng đọc chat history)."""
    client = get_redis()
    items = await client.lrange(key, start, stop)
    return [orjson.loads(item) for item in items]


async def redis_ltrim(key: str, start: int, stop: int):
    """Cắt list giữ lại [start:stop] — sliding window cho chat history."""
    client = get_redis()
    await client.ltrim(key, start, stop)
