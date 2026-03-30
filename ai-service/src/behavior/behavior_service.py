"""
Behavior Analytics Service — Dashboard aggregation queries.

Chức năng:
1. Funnel mua hàng (view → cart → checkout → purchase)
2. Phân khúc khách hàng (VIP, khu vực, giá trị)
3. Tỷ lệ bỏ giỏ hàng
4. Sản phẩm hot (weighted score: view=1, cart=3, purchase=5)
5. Search analytics (top queries, zero-result queries)

Dữ liệu nguồn:
- behavior_events: Hành vi người dùng (từ RabbitMQ consumer)
- orders: Đơn hàng (từ database chung)
- search_logs: Lịch sử tìm kiếm (từ AI Search)
"""

import logging
from sqlalchemy import text

from src.shared.database import async_session_maker
from src.shared.redis_client import redis_get, redis_set
from src.behavior.behavior_schemas import (
    FunnelStage,
    FunnelResponse,
    VipSegment,
    RegionSegment,
    SegmentResponse,
    AbandonmentResponse,
    PopularProduct,
    PopularProductsResponse,
    SearchQueryStat,
    SearchAnalyticsResponse,
)

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════
# 1. FUNNEL MUA HÀNG
# ═══════════════════════════════════════════


async def get_funnel_data(days: int = 30) -> FunnelResponse:
    """
    Tính funnel mua hàng: view → cart → checkout → purchase.

    Mỗi bước đếm số session_id DISTINCT thực hiện event tương ứng.
    """
    cache_key = f"analytics:funnel:{days}"
    cached = await redis_get(cache_key)
    if cached and isinstance(cached, dict):
        return FunnelResponse(**cached)

    stages = []
    total_sessions = 0

    try:
        async with async_session_maker() as db:
            # Đếm sessions cho mỗi loại event
            event_types = [
                ("product_view", "Xem sản phẩm"),
                ("add_to_cart", "Thêm giỏ hàng"),
                ("checkout_start", "Bắt đầu thanh toán"),
                ("purchase_complete", "Hoàn tất mua hàng"),
            ]

            for event_type, label in event_types:
                result = await db.execute(
                    text("""
                        SELECT COUNT(DISTINCT COALESCE(session_id, guest_id, user_id::text)) AS cnt
                        FROM behavior_events
                        WHERE event_type = :event_type
                          AND created_at >= NOW() - MAKE_INTERVAL(days => :days)
                    """),
                    {"event_type": event_type, "days": days},
                )
                row = result.mappings().first()
                count = int(row["cnt"]) if row else 0

                if event_type == "product_view":
                    total_sessions = count

                percent = round((count / total_sessions * 100), 1) if total_sessions > 0 else 0.0
                stages.append(FunnelStage(stage=label, count=count, percent=percent))

    except Exception as e:
        logger.error(f"Funnel query lỗi: {e}")
        # Trả về funnel rỗng nếu bảng chưa có data
        stages = [
            FunnelStage(stage="Xem sản phẩm", count=0, percent=0),
            FunnelStage(stage="Thêm giỏ hàng", count=0, percent=0),
            FunnelStage(stage="Bắt đầu thanh toán", count=0, percent=0),
            FunnelStage(stage="Hoàn tất mua hàng", count=0, percent=0),
        ]

    response = FunnelResponse(days=days, stages=stages, total_sessions=total_sessions)

    # Cache 1 giờ
    try:
        await redis_set(cache_key, response.model_dump(), ttl=3600)
    except Exception:
        pass

    return response


# ═══════════════════════════════════════════
# 2. PHÂN KHÚC KHÁCH HÀNG
# ═══════════════════════════════════════════


async def get_customer_segments() -> SegmentResponse:
    """
    Phân khúc khách hàng theo VIP tier, khu vực, giá trị đơn trung bình.
    """
    cache_key = "analytics:segments"
    cached = await redis_get(cache_key)
    if cached and isinstance(cached, dict):
        return SegmentResponse(**cached)

    vip_segments = []
    region_segments = []
    avg_order_value = 0.0

    try:
        async with async_session_maker() as db:
            # VIP segments
            vip_result = await db.execute(
                text("""
                    SELECT
                        COALESCE(vip_tier, 'none') AS tier,
                        COUNT(*) AS user_count,
                        COALESCE(SUM(total_spent), 0)::float AS total_spent
                    FROM users
                    WHERE role = 'CUSTOMER'
                    GROUP BY vip_tier
                    ORDER BY total_spent DESC
                """)
            )
            for row in vip_result.mappings().all():
                vip_segments.append(VipSegment(
                    tier=str(row["tier"]).lower(),
                    user_count=int(row["user_count"]),
                    total_spent=float(row["total_spent"]),
                ))

            # Region segments (top 10 tỉnh theo đơn hàng)
            region_result = await db.execute(
                text("""
                    SELECT
                        shipping_province AS province,
                        COUNT(*) AS order_count
                    FROM orders
                    WHERE shipping_province IS NOT NULL
                    GROUP BY shipping_province
                    ORDER BY order_count DESC
                    LIMIT 10
                """)
            )
            for row in region_result.mappings().all():
                region_segments.append(RegionSegment(
                    province=str(row["province"]),
                    order_count=int(row["order_count"]),
                ))

            # Average order value
            avg_result = await db.execute(
                text("SELECT AVG(total_amount)::float AS avg_val FROM orders WHERE status != 'CANCELLED'")
            )
            avg_row = avg_result.mappings().first()
            if avg_row and avg_row["avg_val"]:
                avg_order_value = round(float(avg_row["avg_val"]), 0)

    except Exception as e:
        logger.error(f"Segment query lỗi: {e}")

    response = SegmentResponse(
        vip_segments=vip_segments,
        region_segments=region_segments,
        avg_order_value=avg_order_value,
    )

    try:
        await redis_set(cache_key, response.model_dump(), ttl=3600)
    except Exception:
        pass

    return response


# ═══════════════════════════════════════════
# 3. TỶ LỆ BỎ GIỎ HÀNG
# ═══════════════════════════════════════════


async def get_abandonment_rate(days: int = 30) -> AbandonmentResponse:
    """
    Tỷ lệ bỏ giỏ hàng = sessions có add_to_cart nhưng không có purchase_complete.
    """
    try:
        async with async_session_maker() as db:
            # Sessions có add_to_cart
            cart_result = await db.execute(
                text("""
                    SELECT COUNT(DISTINCT COALESCE(session_id, guest_id)) AS cnt
                    FROM behavior_events
                    WHERE event_type = 'add_to_cart'
                      AND created_at >= NOW() - MAKE_INTERVAL(days => :days)
                """),
                {"days": days},
            )
            total_cart = int(cart_result.mappings().first()["cnt"]) if cart_result else 0

            # Sessions có purchase_complete
            purchase_result = await db.execute(
                text("""
                    SELECT COUNT(DISTINCT COALESCE(session_id, guest_id)) AS cnt
                    FROM behavior_events
                    WHERE event_type = 'purchase_complete'
                      AND created_at >= NOW() - MAKE_INTERVAL(days => :days)
                """),
                {"days": days},
            )
            total_purchase = int(purchase_result.mappings().first()["cnt"]) if purchase_result else 0

        abandoned = total_cart - total_purchase
        rate = round((abandoned / total_cart * 100), 1) if total_cart > 0 else 0.0

        return AbandonmentResponse(
            days=days,
            total_cart_sessions=total_cart,
            abandoned_sessions=max(abandoned, 0),
            abandonment_rate=rate,
        )

    except Exception as e:
        logger.error(f"Abandonment query lỗi: {e}")
        return AbandonmentResponse(days=days)


# ═══════════════════════════════════════════
# 4. SẢN PHẨM HOT
# ═══════════════════════════════════════════


async def get_popular_products(days: int = 7, limit: int = 10) -> PopularProductsResponse:
    """
    Top sản phẩm hot theo weighted score: view=1, cart=3, purchase=5.
    """
    try:
        async with async_session_maker() as db:
            result = await db.execute(
                text("""
                    WITH product_scores AS (
                        SELECT
                            (be.event_data->>'product_id')::uuid AS pid,
                            SUM(CASE
                                WHEN be.event_type = 'product_view' THEN 1
                                WHEN be.event_type = 'add_to_cart' THEN 3
                                WHEN be.event_type = 'purchase_complete' THEN 5
                                ELSE 0
                            END) AS score,
                            SUM(CASE WHEN be.event_type = 'product_view' THEN 1 ELSE 0 END) AS views,
                            SUM(CASE WHEN be.event_type = 'add_to_cart' THEN 1 ELSE 0 END) AS carts,
                            SUM(CASE WHEN be.event_type = 'purchase_complete' THEN 1 ELSE 0 END) AS purchases
                        FROM behavior_events be
                        WHERE be.event_data->>'product_id' IS NOT NULL
                          AND be.created_at >= NOW() - MAKE_INTERVAL(days => :days)
                        GROUP BY pid
                    )
                    SELECT
                        p.id::text, p.name, p.slug,
                        COALESCE(ps.views, 0)::int AS view_count,
                        COALESCE(ps.carts, 0)::int AS cart_count,
                        COALESCE(ps.purchases, 0)::int AS purchase_count,
                        COALESCE(ps.score, 0)::float AS score
                    FROM product_scores ps
                    JOIN products p ON p.id = ps.pid
                    WHERE p.is_active = true
                    ORDER BY ps.score DESC
                    LIMIT :limit
                """),
                {"days": days, "limit": limit},
            )
            rows = result.mappings().all()

        products = [
            PopularProduct(
                id=str(r["id"]),
                name=r["name"],
                slug=r["slug"],
                view_count=int(r["view_count"]),
                cart_count=int(r["cart_count"]),
                purchase_count=int(r["purchase_count"]),
                score=float(r["score"]),
            )
            for r in rows
        ]

        return PopularProductsResponse(days=days, products=products)

    except Exception as e:
        logger.error(f"Popular products query lỗi: {e}")
        return PopularProductsResponse(days=days)


# ═══════════════════════════════════════════
# 5. SEARCH ANALYTICS
# ═══════════════════════════════════════════


async def get_search_analytics(days: int = 30) -> SearchAnalyticsResponse:
    """
    Top queries + zero-result queries từ bảng search_logs.
    """
    try:
        async with async_session_maker() as db:
            # Total searches
            total_result = await db.execute(
                text("""
                    SELECT COUNT(*) AS total, COUNT(DISTINCT keyword) AS unique_q
                    FROM search_logs
                    WHERE created_at >= NOW() - MAKE_INTERVAL(days => :days)
                """),
                {"days": days},
            )
            total_row = total_result.mappings().first()
            total_searches = int(total_row["total"]) if total_row else 0
            unique_queries = int(total_row["unique_q"]) if total_row else 0

            # Top queries
            top_result = await db.execute(
                text("""
                    SELECT keyword, COUNT(*) AS cnt, AVG(results_count)::float AS avg_res
                    FROM search_logs
                    WHERE created_at >= NOW() - MAKE_INTERVAL(days => :days)
                    GROUP BY keyword
                    ORDER BY cnt DESC
                    LIMIT 10
                """),
                {"days": days},
            )
            top_queries = [
                SearchQueryStat(
                    keyword=r["keyword"],
                    search_count=int(r["cnt"]),
                    avg_results=round(float(r["avg_res"]), 1),
                )
                for r in top_result.mappings().all()
            ]

            # Zero-result queries
            zero_result = await db.execute(
                text("""
                    SELECT keyword, COUNT(*) AS cnt, 0.0 AS avg_res
                    FROM search_logs
                    WHERE results_count = 0
                      AND created_at >= NOW() - MAKE_INTERVAL(days => :days)
                    GROUP BY keyword
                    ORDER BY cnt DESC
                    LIMIT 10
                """),
                {"days": days},
            )
            zero_result_queries = [
                SearchQueryStat(
                    keyword=r["keyword"],
                    search_count=int(r["cnt"]),
                    avg_results=0.0,
                )
                for r in zero_result.mappings().all()
            ]

        return SearchAnalyticsResponse(
            days=days,
            total_searches=total_searches,
            unique_queries=unique_queries,
            top_queries=top_queries,
            zero_result_queries=zero_result_queries,
        )

    except Exception as e:
        logger.error(f"Search analytics query lỗi: {e}")
        return SearchAnalyticsResponse(days=days)
