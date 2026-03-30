"""
Recommendation Schemas — Pydantic models cho Recommendation API.

Định nghĩa response structure cho:
- Personalized recommendations (logged-in user)
- Trending / cold-start fallback (guest)
"""

from pydantic import BaseModel
from typing import Optional


class RecommendationItem(BaseModel):
    """Một sản phẩm được gợi ý."""
    id: str
    name: str
    slug: str
    price: int
    sale_price: int | None = None
    rating: float = 0.0
    sold: int = 0
    image_url: str | None = None
    score: float = 0.0  # Hybrid recommendation score
    reason: str = ""  # VD: "Dựa trên sản phẩm bạn đã xem"


class RecommendationResponse(BaseModel):
    """Response cho /api/recommendations."""
    type: str  # "personalized" | "trending" | "similar"
    user_id: str | None = None
    total: int = 0
    products: list[RecommendationItem] = []
    cached: bool = False
