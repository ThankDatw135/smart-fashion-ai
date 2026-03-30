"""
Behavior Schemas — Pydantic models cho Behavior Analytics API.

Định nghĩa response structure cho:
- Funnel mua hàng (view → cart → checkout → purchase)
- Phân khúc khách hàng
- Tỷ lệ bỏ giỏ hàng
- Sản phẩm hot
- Search analytics
"""

from pydantic import BaseModel
from typing import Optional


# ─── Funnel ───


class FunnelStage(BaseModel):
    """Một bước trong funnel mua hàng."""
    stage: str  # "Xem sản phẩm", "Thêm giỏ hàng", etc.
    count: int = 0
    percent: float = 0.0  # So với bước đầu tiên


class FunnelResponse(BaseModel):
    """Response cho /api/analytics/funnel."""
    days: int = 30
    stages: list[FunnelStage] = []
    total_sessions: int = 0


# ─── Segments ───


class VipSegment(BaseModel):
    """Phân khúc theo VIP tier."""
    tier: str  # "none", "silver", "gold", "diamond"
    user_count: int = 0
    total_spent: float = 0.0


class RegionSegment(BaseModel):
    """Phân khúc theo khu vực."""
    province: str
    order_count: int = 0


class SegmentResponse(BaseModel):
    """Response cho /api/analytics/segments."""
    vip_segments: list[VipSegment] = []
    region_segments: list[RegionSegment] = []
    avg_order_value: float = 0.0


# ─── Abandonment ───


class AbandonmentResponse(BaseModel):
    """Response cho /api/analytics/abandonment."""
    days: int = 30
    total_cart_sessions: int = 0
    abandoned_sessions: int = 0
    abandonment_rate: float = 0.0  # Tỷ lệ phần trăm


# ─── Popular Products ───


class PopularProduct(BaseModel):
    """Sản phẩm hot."""
    id: str
    name: str
    slug: str
    view_count: int = 0
    cart_count: int = 0
    purchase_count: int = 0
    score: float = 0.0  # Tổng hợp weighted


class PopularProductsResponse(BaseModel):
    """Response cho /api/analytics/popular-products."""
    days: int = 7
    products: list[PopularProduct] = []


# ─── Search Analytics ───


class SearchQueryStat(BaseModel):
    """Thống kê 1 query tìm kiếm."""
    keyword: str
    search_count: int = 0
    avg_results: float = 0.0


class SearchAnalyticsResponse(BaseModel):
    """Response cho /api/analytics/search-stats."""
    days: int = 30
    total_searches: int = 0
    unique_queries: int = 0
    top_queries: list[SearchQueryStat] = []
    zero_result_queries: list[SearchQueryStat] = []
