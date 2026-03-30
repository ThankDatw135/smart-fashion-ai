"""
Recommendation Router — API endpoints cho gợi ý sản phẩm.

Endpoint:
- GET /api/recommendations?type=homepage&limit=8
"""

import logging
from fastapi import APIRouter, Query

from src.recommendation.recommendation_service import get_recommendations
from src.recommendation.recommendation_schemas import RecommendationResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])


@router.get(
    "",
    response_model=RecommendationResponse,
    summary="Gợi ý sản phẩm",
    description=(
        "Gợi ý sản phẩm cá nhân hóa (nếu đã đăng nhập) hoặc trending (guest).\n"
        "Dữ liệu recommendation được train lại mỗi đêm bởi Celery.\n"
        "Cache: Redis TTL 24h."
    ),
)
async def api_recommendations(
    type: str = Query(
        "homepage",
        description="Loại gợi ý: homepage | similar | also_viewed",
    ),
    limit: int = Query(8, ge=1, le=50, description="Số sản phẩm gợi ý"),
    user_id: str | None = Query(None, description="UUID user (nếu đã đăng nhập)"),
) -> RecommendationResponse:
    """
    Lấy danh sách sản phẩm gợi ý.

    Flow:
    1. User đã đăng nhập → check Redis cache → personalized recommendations
    2. Guest hoặc cache miss → trending (bán chạy nhất 7 ngày)
    3. Enrich: JOIN products lấy name, price, image, rating
    """
    return await get_recommendations(
        user_id=user_id,
        rec_type=type,
        limit=limit,
    )
