"""
Knowledge-based Tools — 4 tools đọc dữ liệu từ JSON cục bộ.

Các tool này sử dụng KnowledgeBase singleton đã load sẵn từ Phase 6.
Không cần kết nối DB hay API — truy xuất O(1) từ bộ nhớ.

Tools:
1. get_size_chart — Gợi ý size theo chiều cao/cân nặng
2. skin_tone_advisor — Tư vấn màu theo tông da
3. suggest_style — Gợi ý outfit theo dịp/giới tính
4. faq_knowledge — Tra cứu FAQ chính sách shop
"""

import json
import logging
from langchain_core.tools import tool

from src.knowledge.loader import knowledge_base

logger = logging.getLogger(__name__)


@tool
def get_size_chart(height_cm: int, weight_kg: int, gender: str = "male") -> str:
    """Gợi ý size quần áo dựa trên chiều cao (cm) và cân nặng (kg).

    Sử dụng khi khách hỏi: "mình cao 170 nặng 65 nên mặc size gì?",
    "tư vấn size cho mình", "size M hay L?"

    Args:
        height_cm: Chiều cao tính bằng cm (VD: 170)
        weight_kg: Cân nặng tính bằng kg (VD: 65)
        gender: Giới tính "male" hoặc "female" (mặc định "male")

    Returns:
        Thông tin size gợi ý dạng JSON string
    """
    try:
        result = knowledge_base.get_size_guide(height_cm, weight_kg, gender)
        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"Lỗi get_size_chart: {e}")
        return json.dumps({
            "error": "Không thể tra cứu bảng size lúc này.",
            "suggestion": "Vui lòng liên hệ shop để được tư vấn trực tiếp."
        }, ensure_ascii=False)


@tool
def skin_tone_advisor(skin_tone_description: str) -> str:
    """Tư vấn màu sắc quần áo phù hợp theo tông da.

    Sử dụng khi khách hỏi: "da ngăm mặc màu gì đẹp?",
    "tông da vàng hợp màu nào?", "mình da trắng nên chọn màu gì?"

    Args:
        skin_tone_description: Mô tả tông da (VD: "ngăm", "trắng", "vàng", "đen")

    Returns:
        Thông tin tư vấn màu dạng JSON string
    """
    try:
        result = knowledge_base.get_skin_tone_advice(skin_tone_description)
        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"Lỗi skin_tone_advisor: {e}")
        return json.dumps({
            "error": "Không thể tra cứu tư vấn màu da lúc này.",
            "suggestion": "Thông thường, màu trắng và đen phù hợp với mọi tông da."
        }, ensure_ascii=False)


@tool
def suggest_style(occasion: str, gender: str = "male") -> str:
    """Gợi ý outfit phối đồ theo dịp và giới tính.

    Sử dụng khi khách hỏi: "đi hẹn hò mặc gì?",
    "outfit đi làm nam", "gợi ý đồ đi du lịch biển"

    Args:
        occasion: Dịp cần phối đồ (VD: "date", "office", "travel", "party", "sport")
        gender: Giới tính "male" hoặc "female" (mặc định "male")

    Returns:
        Danh sách outfit combinations dạng JSON string
    """
    try:
        combos = knowledge_base.get_style_combos(occasion=occasion, gender=gender)

        # Nếu không tìm thấy combo theo đúng tên, thử tìm theo keyword
        if not combos:
            all_combos = knowledge_base.get_style_combos()
            combos = [
                c for c in all_combos
                if occasion.lower() in json.dumps(c, ensure_ascii=False).lower()
            ]

        # Thêm layering rules nếu có
        layering = knowledge_base.get_layering_rules()

        result = {
            "occasion": occasion,
            "gender": gender,
            "outfits": combos[:5],  # Tối đa 5 gợi ý
            "layering_tips": layering,
        }
        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"Lỗi suggest_style: {e}")
        return json.dumps({
            "error": "Không thể tìm gợi ý outfit lúc này.",
            "suggestion": "Hãy thử mô tả chi tiết hơn về dịp và phong cách bạn thích."
        }, ensure_ascii=False)


@tool
def faq_knowledge(query: str) -> str:
    """Tra cứu câu hỏi thường gặp (FAQ) về chính sách shop.

    Sử dụng khi khách hỏi: "ship bao nhiêu?", "đổi trả thế nào?",
    "thanh toán bằng gì?", "chính sách VIP", "bảo hành"

    Args:
        query: Từ khóa hoặc chủ đề cần tra cứu
              (VD: "shipping", "payment", "return_policy", "vip", "ship", "đổi trả")

    Returns:
        Danh sách FAQ phù hợp dạng JSON string
    """
    try:
        results = knowledge_base.get_faq(topic=query)

        if not results:
            return json.dumps({
                "found": False,
                "message": f"Không tìm thấy FAQ về '{query}'.",
                "suggestion": "Thử hỏi với từ khóa khác hoặc liên hệ hotline."
            }, ensure_ascii=False)

        return json.dumps({
            "found": True,
            "total": len(results),
            "faqs": results[:5],  # Tối đa 5 kết quả
        }, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"Lỗi faq_knowledge: {e}")
        return json.dumps({
            "error": "Không thể tra cứu FAQ lúc này.",
            "suggestion": "Vui lòng liên hệ hotline để được hỗ trợ."
        }, ensure_ascii=False)
