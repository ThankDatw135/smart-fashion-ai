"""
Search Router — API endpoints cho AI Search.

Endpoints:
- GET /api/search?q=...     → Hybrid search (SQL + vector), target < 500ms
- GET /api/search/suggest?q=... → Auto-suggest, target < 200ms
"""

import logging
from fastapi import APIRouter, Query

from src.search.search_service import full_search, get_suggestions
from src.search.search_schemas import SearchResponse, SuggestResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/search", tags=["Search"])


@router.get(
    "",
    response_model=SearchResponse,
    summary="Tìm kiếm sản phẩm thông minh",
    description=(
        "Hybrid search: SQL exact match + pgvector semantic search.\n"
        "Ranking: 40% semantic + 25% popularity + 20% recency + 15% rating.\n"
        "Target: < 500ms."
    ),
)
async def search_products(
    q: str = Query(..., min_length=1, max_length=200, description="Từ khóa tìm kiếm"),
    min_price: int | None = Query(None, ge=0, description="Giá tối thiểu (VND)"),
    max_price: int | None = Query(None, ge=0, description="Giá tối đa (VND)"),
    category: str | None = Query(None, description="Lọc theo danh mục"),
    page: int = Query(1, ge=1, description="Trang hiện tại"),
    limit: int = Query(20, ge=1, le=50, description="Số kết quả mỗi trang"),
) -> SearchResponse:
    """
    Tìm kiếm sản phẩm bằng AI Hybrid Search.

    Flow:
    1. NLP parse query → structured filters (regex fallback khi Gemini unavailable)
    2. SQL ILIKE search (exact match trên name, description, category)
    3. pgvector cosine similarity search (semantic match)
    4. Merge & rank → top N results
    5. Cache kết quả (Redis, TTL 5 phút)
    """
    return await full_search(
        raw_query=q,
        min_price=min_price,
        max_price=max_price,
        category=category,
        limit=limit,
    )


@router.get(
    "/suggest",
    response_model=SuggestResponse,
    summary="Gợi ý tìm kiếm (auto-complete)",
    description=(
        "Gợi ý keywords phổ biến + sản phẩm + danh mục dựa trên prefix.\n"
        "Target: < 200ms."
    ),
)
async def suggest(
    q: str = Query(..., min_length=2, max_length=100, description="Prefix tìm kiếm"),
) -> SuggestResponse:
    """
    Auto-suggest khi khách gõ tìm kiếm.

    Trả về:
    - keywords: Top keywords phổ biến từ search_logs
    - products: Top sản phẩm matching
    - categories: Danh mục matching
    """
    return await get_suggestions(prefix=q)
