"""
Recommendation Service — Gợi ý sản phẩm cá nhân hóa.

Chiến lược:
1. Personalized: Trả kết quả từ Redis cache (đã được trainer tính sẵn mỗi đêm)
2. Trending: Top sản phẩm bán chạy + xem nhiều 7 ngày gần nhất
3. Cold-start: User mới không có data → fallback trending

Cache TTL: 24 giờ (refresh bởi Celery nightly).
"""

import logging
from sqlalchemy import text

from src.config import settings
from src.shared.database import async_session_maker
from src.shared.redis_client import redis_get, redis_set
from src.recommendation.recommendation_schemas import (
    RecommendationItem,
    RecommendationResponse,
)

logger = logging.getLogger(__name__)


async def get_recommendations(
    user_id: str | None = None,
    rec_type: str = "homepage",
    limit: int = 8,
) -> RecommendationResponse:
    """
    Lấy danh sách sản phẩm gợi ý.

    Flow:
    1. Nếu user_id → check Redis cache "recommendations:user:{user_id}"
    2. Nếu cache miss hoặc guest → fallback trending
    3. Enrich: JOIN products để lấy thông tin đầy đủ

    Args:
        user_id: UUID user đã đăng nhập (None nếu guest)
        rec_type: "homepage" | "similar" | "also_viewed"
        limit: Số sản phẩm trả về (mặc định 8)
    """
    # 1. Try personalized từ Redis cache
    if user_id:
        cache_key = f"recommendations:user:{user_id}"
        cached = await redis_get(cache_key)

        if cached and isinstance(cached, list):
            # Cache có list product_ids + scores
            products = await _enrich_products(cached[:limit])
            if products:
                return RecommendationResponse(
                    type="personalized",
                    user_id=user_id,
                    total=len(products),
                    products=products,
                    cached=True,
                )

    # 2. Fallback: trending
    trending = await get_trending(days=7, limit=limit)
    return RecommendationResponse(
        type="trending",
        user_id=user_id,
        total=len(trending),
        products=trending,
        cached=False,
    )


async def get_trending(days: int = 7, limit: int = 20) -> list[RecommendationItem]:
    """
    Top sản phẩm trending: ORDER BY sold_count DESC, view_count DESC.

    Cache: Redis key "recommendations:trending", TTL 24h.
    """
    cache_key = "recommendations:trending"
    cached = await redis_get(cache_key)

    if cached and isinstance(cached, list):
        result = [RecommendationItem(**item) for item in cached[:limit]]
        if result:
            return result

    try:
        async with async_session_maker() as db:
            result = await db.execute(
                text("""
                    SELECT
                        p.id::text,
                        p.name,
                        p.slug,
                        p.price::int,
                        p.sale_price::int,
                        p.avg_rating::float AS rating,
                        p.sold_count AS sold,
                        (SELECT pi.image_url FROM product_images pi
                         WHERE pi.product_id = p.id AND pi.is_primary = true
                         LIMIT 1) AS image_url
                    FROM products p
                    WHERE p.is_active = true
                    ORDER BY p.sold_count DESC, p.view_count DESC
                    LIMIT :limit
                """),
                {"limit": limit},
            )
            rows = result.mappings().all()

        items = []
        for r in rows:
            items.append(RecommendationItem(
                id=str(r["id"]),
                name=r["name"],
                slug=r["slug"],
                price=int(r["price"]) if r["price"] else 0,
                sale_price=int(r["sale_price"]) if r.get("sale_price") else None,
                rating=float(r["rating"]) if r.get("rating") else 0,
                sold=int(r["sold"]) if r.get("sold") else 0,
                image_url=r.get("image_url"),
                reason="Sản phẩm bán chạy",
            ))

        # Cache 24h
        try:
            await redis_set(
                cache_key,
                [item.model_dump() for item in items],
                ttl=settings.RECOMMENDATION_CACHE_TTL,
            )
        except Exception:
            pass

        return items

    except Exception as e:
        logger.error(f"Trending query lỗi: {e}")
        return []


async def _enrich_products(
    cached_items: list[dict],
) -> list[RecommendationItem]:
    """
    Enrich product IDs từ cache bằng JOIN products để lấy thông tin đầy đủ.

    cached_items format: [{"id": "...", "score": 0.85, "reason": "..."}, ...]
    """
    if not cached_items:
        return []

    product_ids = [item["id"] for item in cached_items if "id" in item]
    if not product_ids:
        return []

    # Build scores lookup
    scores_map = {item["id"]: item for item in cached_items}

    try:
        # Dùng ANY(ARRAY[...]) để batch query
        ids_array = "{" + ",".join(product_ids) + "}"

        async with async_session_maker() as db:
            result = await db.execute(
                text("""
                    SELECT
                        p.id::text,
                        p.name,
                        p.slug,
                        p.price::int,
                        p.sale_price::int,
                        p.avg_rating::float AS rating,
                        p.sold_count AS sold,
                        (SELECT pi.image_url FROM product_images pi
                         WHERE pi.product_id = p.id AND pi.is_primary = true
                         LIMIT 1) AS image_url
                    FROM products p
                    WHERE p.id = ANY(:ids::uuid[])
                      AND p.is_active = true
                """),
                {"ids": ids_array},
            )
            rows = result.mappings().all()

        items = []
        for r in rows:
            pid = str(r["id"])
            meta = scores_map.get(pid, {})
            items.append(RecommendationItem(
                id=pid,
                name=r["name"],
                slug=r["slug"],
                price=int(r["price"]) if r["price"] else 0,
                sale_price=int(r["sale_price"]) if r.get("sale_price") else None,
                rating=float(r["rating"]) if r.get("rating") else 0,
                sold=int(r["sold"]) if r.get("sold") else 0,
                image_url=r.get("image_url"),
                score=float(meta.get("score", 0)),
                reason=meta.get("reason", "Gợi ý cho bạn"),
            ))

        # Sắp xếp theo score DESC
        items.sort(key=lambda x: x.score, reverse=True)
        return items

    except Exception as e:
        logger.error(f"Enrich products lỗi: {e}")
        return []
