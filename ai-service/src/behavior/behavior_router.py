"""
Behavior Analytics Router — Dashboard API endpoints.

Endpoints:
- GET /api/analytics/funnel          → Funnel mua hàng
- GET /api/analytics/segments        → Phân khúc khách hàng
- GET /api/analytics/abandonment     → Tỷ lệ bỏ giỏ hàng
- GET /api/analytics/popular-products → Sản phẩm hot
- GET /api/analytics/search-stats    → Search analytics
"""

import logging
from fastapi import APIRouter, Query

from src.behavior.behavior_service import (
    get_funnel_data,
    get_customer_segments,
    get_abandonment_rate,
    get_popular_products,
    get_search_analytics,
)
from src.behavior.behavior_schemas import (
    FunnelResponse,
    SegmentResponse,
    AbandonmentResponse,
    PopularProductsResponse,
    SearchAnalyticsResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get(
    "/funnel",
    response_model=FunnelResponse,
    summary="Funnel mua hàng",
    description="Phân tích funnel: Xem → Giỏ hàng → Thanh toán → Mua.",
)
async def api_funnel(
    days: int = Query(30, ge=1, le=365, description="Số ngày phân tích"),
) -> FunnelResponse:
    return await get_funnel_data(days=days)


@router.get(
    "/segments",
    response_model=SegmentResponse,
    summary="Phân khúc khách hàng",
    description="Phân khúc theo VIP tier, khu vực, giá trị đơn trung bình.",
)
async def api_segments() -> SegmentResponse:
    return await get_customer_segments()


@router.get(
    "/abandonment",
    response_model=AbandonmentResponse,
    summary="Tỷ lệ bỏ giỏ hàng",
    description="Sessions có add_to_cart nhưng không có purchase_complete.",
)
async def api_abandonment(
    days: int = Query(30, ge=1, le=365, description="Số ngày phân tích"),
) -> AbandonmentResponse:
    return await get_abandonment_rate(days=days)


@router.get(
    "/popular-products",
    response_model=PopularProductsResponse,
    summary="Sản phẩm hot",
    description="Top sản phẩm theo weighted score: view=1, cart=3, purchase=5.",
)
async def api_popular_products(
    days: int = Query(7, ge=1, le=90, description="Số ngày phân tích"),
    limit: int = Query(10, ge=1, le=50, description="Số sản phẩm trả về"),
) -> PopularProductsResponse:
    return await get_popular_products(days=days, limit=limit)


@router.get(
    "/search-stats",
    response_model=SearchAnalyticsResponse,
    summary="Thống kê tìm kiếm",
    description="Top queries, zero-result queries từ search_logs.",
)
async def api_search_stats(
    days: int = Query(30, ge=1, le=365, description="Số ngày phân tích"),
) -> SearchAnalyticsResponse:
    return await get_search_analytics(days=days)
