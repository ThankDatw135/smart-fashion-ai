"""
Database Tools — 3 tools truy xuất dữ liệu từ PostgreSQL hoặc Backend API.

Phương án Hybrid (đã duyệt):
- search_products: READ-ONLY trực tiếp DB (SQL LIKE, Phase 7)
- check_stock: READ-ONLY trực tiếp DB (query variants)
- get_order_status: Mock response (chờ Backend API)

Ghi chú:
- Phase 7: search_products dùng SQL LIKE
- Phase 8: Nâng cấp lên pgvector semantic search

Lưu ý bảo mật: AI Service chỉ READ — KHÔNG bao giờ INSERT/UPDATE/DELETE.
"""

import json
import logging
from langchain_core.tools import tool

from src.knowledge.loader import knowledge_base
from src.shared.database import async_session_maker
from sqlalchemy import text

logger = logging.getLogger(__name__)


@tool
async def search_products(
    query: str,
    min_price: int = 0,
    max_price: int = 10000000,
) -> str:
    """Tìm kiếm sản phẩm theo từ khóa, giá tối thiểu và giá tối đa.

    Sử dụng khi khách hỏi: "tìm áo thun nam dưới 300k",
    "có đầm nào giá 500k không?", "quần jean xanh"

    Args:
        query: Từ khóa tìm kiếm (VD: "áo thun nam", "váy", "hoodie")
        min_price: Giá tối thiểu VND (mặc định 0)
        max_price: Giá tối đa VND (mặc định 10.000.000)

    Returns:
        Danh sách sản phẩm dạng JSON string (tối đa 5 sản phẩm)
    """
    try:
        # Phase 8: Sử dụng Hybrid Search (SQL + pgvector)
        from src.search.search_service import full_search

        result = await full_search(
            raw_query=query,
            min_price=min_price,
            max_price=max_price,
            limit=5,  # Chatbot chỉ cần top 5
        )

        if not result.results:
            return json.dumps({
                "found": False,
                "query": query,
                "message": f"Không tìm thấy sản phẩm nào cho '{query}'.",
                "suggestion": "Thử dùng từ khóa khác hoặc mở rộng khoảng giá."
            }, ensure_ascii=False)

        products = []
        for item in result.results:
            products.append({
                "id": item.id,
                "name": item.name,
                "slug": item.slug,
                "price": item.price,
                "sale_price": item.sale_price,
                "rating": item.rating,
                "sold": item.sold,
            })

        return json.dumps({
            "found": True,
            "query": query,
            "total": len(products),
            "products": products,
        }, ensure_ascii=False, indent=2)

    except Exception as e:
        logger.error(f"Lỗi search_products: {e}")
        return json.dumps({
            "found": False,
            "error": "Không thể tìm kiếm sản phẩm lúc này.",
            "query": query,
        }, ensure_ascii=False)


@tool
async def check_stock(
    product_name: str,
    size: str = "",
    color: str = "",
) -> str:
    """Kiểm tra tồn kho của sản phẩm theo size và màu.

    Sử dụng khi khách hỏi: "áo thun trắng size M còn không?",
    "hoodie đen size L hết chưa?", "sản phẩm này còn size gì?"

    Args:
        product_name: Tên hoặc từ khóa sản phẩm (VD: "áo thun basic")
        size: Size cần check (VD: "M", "L", "XL") — bỏ trống để xem tất cả
        color: Màu cần check (VD: "đen", "trắng") — bỏ trống để xem tất cả

    Returns:
        Thông tin tồn kho dạng JSON string
    """
    try:
        # Sửa lỗi chính tả và ánh xạ size alias
        corrected_name = knowledge_base.correct_typo(product_name)
        size_mapped = knowledge_base.get_size_alias(size) if size else size

        # Query DB: tìm sản phẩm trước, rồi check variants
        params = {"name_pattern": f"%{corrected_name.lower()}%"}

        # Xây dựng điều kiện variant filter
        variant_conditions = []
        if size_mapped or size:
            actual_size = size_mapped or size
            variant_conditions.append("LOWER(v.size) = :size_val")
            params["size_val"] = actual_size.lower()
        if color:
            variant_conditions.append("LOWER(v.color) = :color_val")
            params["color_val"] = color.lower()

        variant_where = (" AND " + " AND ".join(variant_conditions)) if variant_conditions else ""

        sql = text(f"""
            SELECT
                p.name as product_name,
                p.slug,
                v.size,
                v.color,
                v.stock_quantity,
                v.sku
            FROM products p
            JOIN product_variants v ON v.product_id = p.id
            WHERE LOWER(p.name) LIKE :name_pattern
              AND p.is_active = true
              {variant_where}
            ORDER BY v.size, v.color
            LIMIT 20
        """)

        async with async_session_maker() as db:
            result = await db.execute(sql, params)
            rows = result.mappings().all()

        if not rows:
            return json.dumps({
                "found": False,
                "product_name": product_name,
                "message": f"Không tìm thấy sản phẩm '{product_name}' hoặc không có variant phù hợp.",
            }, ensure_ascii=False)

        variants = []
        for row in rows:
            stock = int(row["stock_quantity"]) if row["stock_quantity"] else 0
            variants.append({
                "product_name": row["product_name"],
                "size": row["size"],
                "color": row["color"],
                "stock": stock,
                "in_stock": stock > 0,
                "status": "Còn hàng" if stock > 0 else "Hết hàng",
            })

        in_stock_count = sum(1 for v in variants if v["in_stock"])

        return json.dumps({
            "found": True,
            "product_name": variants[0]["product_name"] if variants else product_name,
            "total_variants": len(variants),
            "in_stock_variants": in_stock_count,
            "variants": variants,
        }, ensure_ascii=False, indent=2)

    except Exception as e:
        logger.error(f"Lỗi check_stock: {e}")
        return json.dumps({
            "found": False,
            "error": "Không thể kiểm tra tồn kho lúc này.",
            "product_name": product_name,
        }, ensure_ascii=False)


@tool
async def get_order_status(order_code: str) -> str:
    """Tra cứu trạng thái đơn hàng theo mã đơn.

    Sử dụng khi khách hỏi: "đơn hàng SF-20240315-001 đến đâu rồi?",
    "check đơn hàng cho mình", "mình muốn xem đơn ORD-001"

    Ghi chú: Phase 7 trả mock response. Khi Backend có API orders
    sẽ chuyển sang gọi HTTP → http://backend:4000/api/v1/orders/{code}

    Args:
        order_code: Mã đơn hàng (VD: "SF-20240315-001")

    Returns:
        Thông tin đơn hàng dạng JSON string
    """
    # Phase 7: Mock response — chờ Backend API hoàn chỉnh
    # TODO: Phase tiếp theo — gọi qua Backend REST API
    # import httpx
    # async with httpx.AsyncClient() as client:
    #     resp = await client.get(f"{settings.BACKEND_API_URL}/orders/{order_code}")
    #     return resp.text

    logger.info(f"Tra cứu đơn hàng (mock): {order_code}")

    return json.dumps({
        "status": "developing",
        "order_code": order_code,
        "message": (
            f"Tính năng tra cứu đơn hàng đang được phát triển. "
            f"Mã đơn '{order_code}' đã được ghi nhận. "
            f"Bạn vui lòng liên hệ hotline 0123-456-789 hoặc inbox fanpage "
            f"để được hỗ trợ kiểm tra trạng thái đơn hàng nhé!"
        ),
    }, ensure_ascii=False)
