"""
AI Search Service — Hybrid Search (SQL + pgvector).

Kiến trúc:
1. NLP Parse: Gemini (primary) → Regex Fallback (khi quota exceeded)
2. SQL Search: ILIKE trên products + categories + price filter
3. Vector Search: pgvector cosine similarity (<=>)
4. Merge & Rank: 40% semantic + 25% popularity + 20% recency + 15% rating
5. Cache: Redis (TTL 5 phút)
6. Log: Ghi search_logs cho suggest + analytics

Performance targets:
- Full search: < 500ms
- Auto-suggest: < 200ms
"""

import re
import json
import hashlib
import logging
import time
from datetime import datetime
from typing import Any

from sqlalchemy import text

from src.config import settings
from src.shared.database import async_session_maker
from src.shared.redis_client import redis_get, redis_set
from src.search.embedding_service import embedding_service
from src.search.search_schemas import (
    ParsedFilters,
    SearchResultItem,
    SearchResponse,
    SuggestKeyword,
    SuggestProduct,
    SuggestCategory,
    SuggestResponse,
)

logger = logging.getLogger(__name__)

# ─── Vietnamese price patterns cho regex fallback ───

_PRICE_PATTERNS = [
    # "dưới 500k", "under 500k"
    (r"(?:dưới|under|<)\s*(\d+)\s*k", lambda m: (0, int(m.group(1)) * 1000)),
    # "trên 200k", "trên 1 triệu"
    (r"(?:trên|trên|>)\s*(\d+)\s*k", lambda m: (int(m.group(1)) * 1000, 10_000_000)),
    (r"(?:trên|>)\s*(\d+)\s*(?:triệu|tr)", lambda m: (int(m.group(1)) * 1_000_000, 10_000_000)),
    # "từ 200k đến 500k", "200k-500k"
    (r"(?:từ\s*)?(\d+)\s*k?\s*(?:đến|-)\s*(\d+)\s*k", lambda m: (int(m.group(1)) * 1000, int(m.group(2)) * 1000)),
    # "500.000đ", "500000đ"
    (r"(\d{3,})\s*(?:đ|vnđ|vnd|₫)", lambda m: (0, int(m.group(1).replace(".", "")))),
]

# Gender detection keywords
_GENDER_KEYWORDS = {
    "male": ["nam", "men", "boy", "chàng", "anh"],
    "female": ["nữ", "women", "girl", "chị", "cô", "lady"],
}

# Size keywords
_SIZE_PATTERN = re.compile(r"\b(xs|s|m|l|xl|xxl|2xl|3xl|free size)\b", re.IGNORECASE)

# Color keywords
_COLOR_KEYWORDS = [
    "đen", "trắng", "đỏ", "xanh", "vàng", "hồng", "tím",
    "xám", "nâu", "be", "kem", "cam", "xanh lá", "xanh dương",
    "black", "white", "red", "blue", "green", "pink",
]


# ═══════════════════════════════════════════
# 1. NLP QUERY PARSER
# ═══════════════════════════════════════════


async def parse_query(raw_query: str) -> ParsedFilters:
    """
    Parse search query thành structured filters.

    Strategy:
    - Primary: Gemini 2.0 Flash (nếu available)
    - Fallback: Regex parser tiếng Việt (luôn hoạt động)
    - Cache: Redis TTL 5 phút

    Returns:
        ParsedFilters với category, style, price range, color, size, gender
    """
    if not raw_query.strip():
        return ParsedFilters(raw_query=raw_query)

    # Check cache
    cache_key = f"search:parse:{_hash_query(raw_query)}"
    cached = await redis_get(cache_key)
    if cached and isinstance(cached, dict):
        logger.debug(f"Parse cache HIT: {raw_query}")
        return ParsedFilters(**cached)

    # Sử dụng regex parser (stable, không phụ thuộc Gemini quota)
    filters = _regex_parse(raw_query)

    # Cache kết quả
    try:
        await redis_set(cache_key, filters.model_dump(), ttl=settings.SEARCH_CACHE_TTL)
    except Exception:
        pass  # Cache failure không block search

    return filters


def _regex_parse(raw_query: str) -> ParsedFilters:
    """
    Regex parser tiếng Việt — fallback khi Gemini unavailable.

    Parse: giá, size, màu, giới tính từ query text.
    Phần còn lại → category/style keyword.
    """
    query_lower = raw_query.lower().strip()
    min_price = 0
    max_price = 10_000_000

    # Extract price
    for pattern, extractor in _PRICE_PATTERNS:
        match = re.search(pattern, query_lower)
        if match:
            min_price, max_price = extractor(match)
            query_lower = re.sub(pattern, "", query_lower).strip()
            break

    # Extract gender
    gender = None
    for g, keywords in _GENDER_KEYWORDS.items():
        for kw in keywords:
            if kw in query_lower:
                gender = g
                break
        if gender:
            break

    # Extract size
    size = None
    size_match = _SIZE_PATTERN.search(query_lower)
    if size_match:
        size = size_match.group(1).upper()

    # Extract color
    color = None
    for c in _COLOR_KEYWORDS:
        if c in query_lower:
            color = c
            break

    # Phần còn lại là category/style
    remaining = query_lower
    # Xóa noise words
    for noise in ["cho", "tìm", "kiếm", "mua", "có", "không", "giá", "còn", "bán"]:
        remaining = remaining.replace(noise, "")
    remaining = re.sub(r"\s+", " ", remaining).strip()

    return ParsedFilters(
        category=remaining if remaining else None,
        style=None,
        color=color,
        size=size,
        min_price=min_price,
        max_price=max_price,
        gender=gender,
        raw_query=raw_query,
    )


# ═══════════════════════════════════════════
# 2. SQL SEARCH (Exact Match)
# ═══════════════════════════════════════════


async def sql_search(
    filters: ParsedFilters,
    limit: int = 50,
) -> list[dict]:
    """
    SQL search: ILIKE trên products.name, products.description + JOIN categories.

    Returns:
        List of product dicts với {id, name, slug, price, sale_price, ...}
    """
    conditions = ["p.is_active = true"]
    params: dict[str, Any] = {
        "min_price": filters.min_price,
        "max_price": filters.max_price,
        "limit": limit,
    }

    # Category/keyword filter
    if filters.category:
        conditions.append(
            "(LOWER(p.name) LIKE :kw OR LOWER(p.description) LIKE :kw OR LOWER(c.name) LIKE :kw)"
        )
        params["kw"] = f"%{filters.category.lower()}%"

    # Color filter
    if filters.color:
        conditions.append("""
            EXISTS (
                SELECT 1 FROM product_variants v
                WHERE v.product_id = p.id AND LOWER(v.color) LIKE :color
            )
        """)
        params["color"] = f"%{filters.color.lower()}%"

    # Price filter
    conditions.append("p.price >= :min_price AND p.price <= :max_price")

    where_clause = " AND ".join(conditions)

    sql = text(f"""
        SELECT
            p.id::text,
            p.name,
            p.slug,
            p.price::int,
            p.sale_price::int,
            p.avg_rating::float AS rating,
            p.sold_count AS sold,
            p.view_count,
            p.created_at,
            c.name AS category_name
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE {where_clause}
        ORDER BY p.sold_count DESC, p.avg_rating DESC
        LIMIT :limit
    """)

    try:
        async with async_session_maker() as db:
            result = await db.execute(sql, params)
            rows = result.mappings().all()
            return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"SQL search lỗi: {e}")
        return []


# ═══════════════════════════════════════════
# 3. VECTOR SEARCH (Semantic Match via pgvector)
# ═══════════════════════════════════════════


async def vector_search(
    query_text: str,
    limit: int = 50,
) -> list[dict]:
    """
    pgvector semantic search: cosine similarity.

    Embed query → so sánh với product_embeddings → top N.

    Returns:
        List of product dicts với similarity score.
    """
    if not embedding_service.is_ready:
        logger.warning("Embedding model chưa sẵn sàng, skip vector search.")
        return []

    try:
        # Embed query text
        query_embedding = embedding_service.generate_embedding(query_text)
        vector_str = f"[{','.join(str(x) for x in query_embedding)}]"

        sql = text("""
            SELECT
                p.id::text,
                p.name,
                p.slug,
                p.price::int,
                p.sale_price::int,
                p.avg_rating::float AS rating,
                p.sold_count AS sold,
                p.view_count,
                p.created_at,
                c.name AS category_name,
                1 - (pe.embedding <=> :query_vec::vector) AS similarity
            FROM product_embeddings pe
            JOIN products p ON p.id = pe.product_id
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE p.is_active = true
            ORDER BY pe.embedding <=> :query_vec::vector
            LIMIT :limit
        """)

        async with async_session_maker() as db:
            result = await db.execute(sql, {"query_vec": vector_str, "limit": limit})
            rows = result.mappings().all()
            return [dict(r) for r in rows]

    except Exception as e:
        logger.error(f"Vector search lỗi: {e}")
        return []


# ═══════════════════════════════════════════
# 4. HYBRID MERGE & RANK
# ═══════════════════════════════════════════


def hybrid_merge(
    sql_results: list[dict],
    vector_results: list[dict],
    max_results: int = 20,
) -> list[SearchResultItem]:
    """
    Merge SQL + Vector results, dedup, tính hybrid score.

    Score = 0.40×semantic + 0.25×popularity + 0.20×recency + 0.15×rating

    Returns:
        Danh sách SearchResultItem đã sắp xếp theo score DESC.
    """
    candidates: dict[str, dict] = {}

    # Merge SQL results (không có semantic score)
    for r in sql_results:
        pid = str(r["id"])
        if pid not in candidates:
            candidates[pid] = {**r, "similarity": 0.0}

    # Merge Vector results (có similarity score)
    for r in vector_results:
        pid = str(r["id"])
        if pid in candidates:
            # Update similarity nếu có
            candidates[pid]["similarity"] = float(r.get("similarity", 0))
        else:
            candidates[pid] = {**r}

    if not candidates:
        return []

    # Tính normalized scores
    max_sold = max((c.get("sold", 0) for c in candidates.values()), default=1) or 1
    now = datetime.now()

    scored_items: list[tuple[float, dict]] = []

    for pid, data in candidates.items():
        semantic = float(data.get("similarity", 0))
        popularity = min(float(data.get("sold", 0)) / max_sold, 1.0)
        rating = float(data.get("rating", 0)) / 5.0

        # Recency: sản phẩm mới hơn → điểm cao hơn
        created = data.get("created_at")
        if created:
            if isinstance(created, str):
                try:
                    created = datetime.fromisoformat(created)
                except (ValueError, TypeError):
                    created = now
            days_old = max((now - created).days, 0)
            recency = max(1.0 - (days_old / 90.0), 0.0)  # Decay trong 90 ngày
        else:
            recency = 0.5

        score = (
            0.40 * semantic
            + 0.25 * popularity
            + 0.20 * recency
            + 0.15 * rating
        )

        scored_items.append((score, data))

    # Sort by score DESC
    scored_items.sort(key=lambda x: x[0], reverse=True)

    # Convert to SearchResultItem
    results = []
    for score, data in scored_items[:max_results]:
        results.append(SearchResultItem(
            id=str(data["id"]),
            name=data.get("name", ""),
            slug=data.get("slug", ""),
            price=int(data.get("price", 0)),
            sale_price=int(data["sale_price"]) if data.get("sale_price") else None,
            rating=float(data.get("rating", 0)),
            sold=int(data.get("sold", 0)),
            category=data.get("category_name"),
            image_url=None,  # Lấy từ product_images nếu cần
            score=round(score, 4),
        ))

    return results


# ═══════════════════════════════════════════
# 5. FULL SEARCH ORCHESTRATION
# ═══════════════════════════════════════════


async def full_search(
    raw_query: str,
    min_price: int | None = None,
    max_price: int | None = None,
    category: str | None = None,
    limit: int = 20,
    user_id: str | None = None,
    session_id: str | None = None,
) -> SearchResponse:
    """
    Orchestrate full hybrid search pipeline.

    1. Parse query → structured filters
    2. SQL search (exact match)
    3. Vector search (semantic match)
    4. Merge & rank
    5. Log search
    6. Cache results
    """
    start_time = time.time()

    # Check cache
    cache_key = f"search:results:{_hash_query(raw_query)}:{min_price}:{max_price}:{category}"
    cached = await redis_get(cache_key)
    if cached and isinstance(cached, dict):
        elapsed = int((time.time() - start_time) * 1000)
        logger.info(f"Search cache HIT: '{raw_query}' ({elapsed}ms)")
        return SearchResponse(**cached, cached=True, search_time_ms=elapsed)

    # 1. Parse query
    filters = await parse_query(raw_query)

    # Override nếu user truyền explicit min/max price
    if min_price is not None:
        filters.min_price = min_price
    if max_price is not None:
        filters.max_price = max_price
    if category:
        filters.category = category

    # 2. SQL search
    sql_results = await sql_search(filters, limit=50)

    # 3. Vector search
    vector_results = await vector_search(raw_query, limit=50)

    # 4. Merge & rank
    ranked = hybrid_merge(sql_results, vector_results, max_results=limit)

    # 5. Log search
    await _log_search(raw_query, len(ranked), user_id, session_id)

    # Build response
    elapsed = int((time.time() - start_time) * 1000)

    response = SearchResponse(
        query=raw_query,
        filters_applied=filters,
        total=len(ranked),
        results=ranked,
        cached=False,
        search_time_ms=elapsed,
    )

    # 6. Cache results
    try:
        await redis_set(
            cache_key,
            response.model_dump(exclude={"cached", "search_time_ms"}),
            ttl=settings.SEARCH_CACHE_TTL,
        )
    except Exception:
        pass

    logger.info(f"Search '{raw_query}' → {len(ranked)} results ({elapsed}ms)")
    return response


# ═══════════════════════════════════════════
# 6. AUTO-SUGGEST
# ═══════════════════════════════════════════


async def get_suggestions(prefix: str) -> SuggestResponse:
    """
    Auto-suggest: keywords + products + categories.

    Target: < 200ms (chỉ dùng SQL ILIKE, không vector search).
    """
    if not prefix or len(prefix) < 2:
        return SuggestResponse(query=prefix)

    prefix_lower = prefix.lower()

    keywords: list[SuggestKeyword] = []
    products: list[SuggestProduct] = []
    categories: list[SuggestCategory] = []

    try:
        async with async_session_maker() as db:
            # 1. Keyword suggestions từ search_logs
            try:
                kw_result = await db.execute(
                    text("""
                        SELECT keyword, COUNT(*) AS cnt
                        FROM search_logs
                        WHERE LOWER(keyword) LIKE :prefix
                        GROUP BY keyword
                        ORDER BY cnt DESC
                        LIMIT :limit
                    """),
                    {"prefix": f"{prefix_lower}%", "limit": settings.SEARCH_SUGGEST_LIMIT},
                )
                keywords = [
                    SuggestKeyword(keyword=r["keyword"], count=int(r["cnt"]))
                    for r in kw_result.mappings().all()
                ]
            except Exception as e:
                # Bảng search_logs có thể chưa tồn tại ban đầu
                logger.debug(f"Suggest keywords skip (bảng chưa có?): {e}")

            # 2. Product suggestions
            prod_result = await db.execute(
                text("""
                    SELECT name, slug, price::int
                    FROM products
                    WHERE LOWER(name) LIKE :kw AND is_active = true
                    ORDER BY sold_count DESC
                    LIMIT 3
                """),
                {"kw": f"%{prefix_lower}%"},
            )
            products = [
                SuggestProduct(
                    name=r["name"],
                    slug=r["slug"],
                    price=int(r["price"]),
                )
                for r in prod_result.mappings().all()
            ]

            # 3. Category suggestions
            cat_result = await db.execute(
                text("""
                    SELECT name, slug FROM categories
                    WHERE LOWER(name) LIKE :kw AND is_active = true
                    LIMIT 2
                """),
                {"kw": f"%{prefix_lower}%"},
            )
            categories = [
                SuggestCategory(name=r["name"], slug=r["slug"])
                for r in cat_result.mappings().all()
            ]

    except Exception as e:
        logger.error(f"Suggest lỗi: {e}")

    return SuggestResponse(
        query=prefix,
        keywords=keywords,
        products=products,
        categories=categories,
    )


# ═══════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════


def _hash_query(query: str) -> str:
    """Hash query string cho cache key."""
    return hashlib.md5(query.strip().lower().encode()).hexdigest()[:12]


async def _log_search(
    keyword: str,
    results_count: int,
    user_id: str | None = None,
    session_id: str | None = None,
) -> None:
    """Ghi log lượt tìm kiếm vào bảng search_logs."""
    try:
        async with async_session_maker() as db:
            await db.execute(
                text("""
                    INSERT INTO search_logs (id, keyword, results_count, user_id, session_id, created_at)
                    VALUES (gen_random_uuid(), :keyword, :results_count, :user_id, :session_id, NOW())
                """),
                {
                    "keyword": keyword.strip()[:255],
                    "results_count": results_count,
                    "user_id": user_id,
                    "session_id": session_id,
                },
            )
            await db.commit()
    except Exception as e:
        # Log failure không block search — graceful degradation
        logger.debug(f"Không thể ghi search log: {e}")
