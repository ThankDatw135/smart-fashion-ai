"""
Search Schemas — Pydantic models cho AI Search API.

Định nghĩa request/response structure cho:
- Full search (hybrid SQL + vector)
- Auto-suggest (keyword + product + category)
"""

from pydantic import BaseModel, Field
from typing import Optional


# ─── Search Request/Response ───


class ParsedFilters(BaseModel):
    """Kết quả parse query bằng NLP hoặc regex."""
    category: str | None = None
    style: str | None = None
    color: str | None = None
    size: str | None = None
    min_price: int = 0
    max_price: int = 10_000_000
    gender: str | None = None
    raw_query: str = ""


class SearchResultItem(BaseModel):
    """Một sản phẩm trong kết quả search."""
    id: str
    name: str
    slug: str
    price: int
    sale_price: int | None = None
    rating: float = 0.0
    sold: int = 0
    category: str | None = None
    image_url: str | None = None
    score: float = 0.0  # Hybrid ranking score


class SearchResponse(BaseModel):
    """Response cho /api/search."""
    query: str
    filters_applied: ParsedFilters
    total: int = 0
    results: list[SearchResultItem] = []
    cached: bool = False
    search_time_ms: int = 0


# ─── Suggest Response ───


class SuggestKeyword(BaseModel):
    """Một keyword gợi ý."""
    keyword: str
    count: int = 0


class SuggestProduct(BaseModel):
    """Một sản phẩm gợi ý."""
    name: str
    slug: str
    price: int
    image_url: str | None = None


class SuggestCategory(BaseModel):
    """Một danh mục gợi ý."""
    name: str
    slug: str


class SuggestResponse(BaseModel):
    """Response cho /api/search/suggest."""
    query: str
    keywords: list[SuggestKeyword] = []
    products: list[SuggestProduct] = []
    categories: list[SuggestCategory] = []
