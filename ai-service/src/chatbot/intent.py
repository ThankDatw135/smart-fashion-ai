"""
Intent Classifier — Phân loại ý định người dùng.

Sử dụng Gemini 2.0 Flash với Structured Output để phân loại
tin nhắn của khách hàng vào 1 trong 10 intents.

Luồng: User message → Gemini → {"intent": "search_product", "confidence": 0.95}
"""

import json
import logging
from enum import Enum

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

from src.config import settings

logger = logging.getLogger(__name__)


class Intent(str, Enum):
    """10 loại ý định mà chatbot hỗ trợ."""
    SEARCH_PRODUCT = "search_product"
    CHECK_STOCK = "check_stock"
    SIZE_ADVICE = "size_advice"
    SKIN_TONE = "skin_tone"
    STYLE_ADVICE = "style_advice"
    ORDER_STATUS = "order_status"
    FAQ = "faq"
    GREETING = "greeting"
    OUT_OF_SCOPE = "out_of_scope"
    GENERAL_CHAT = "general_chat"


# Ánh xạ intent → tool name
INTENT_TO_TOOL = {
    Intent.SEARCH_PRODUCT: "search_products",
    Intent.CHECK_STOCK: "check_stock",
    Intent.SIZE_ADVICE: "get_size_chart",
    Intent.SKIN_TONE: "skin_tone_advisor",
    Intent.STYLE_ADVICE: "suggest_style",
    Intent.ORDER_STATUS: "get_order_status",
    Intent.FAQ: "faq_knowledge",
    # greeting, out_of_scope, general_chat — không cần tool
}

# Prompt phân loại ý định — thiết kế tối ưu cho Gemini
_CLASSIFIER_PROMPT = """Bạn là hệ thống phân loại ý định (intent classifier) cho chatbot bán quần áo thời trang.

Phân loại tin nhắn khách hàng vào ĐÚNG 1 trong 10 intent sau:

1. **search_product** — Tìm, mua sản phẩm: "tìm áo thun nam", "có váy nào dưới 500k?", "show hàng mới"
2. **check_stock** — Kiểm tra tồn kho: "còn size M không?", "áo đen hết chưa?", "sản phẩm này còn hàng không?"
3. **size_advice** — Tư vấn size: "cao 170 nặng 65 mặc size gì?", "size M hay L?", "bảng size"
4. **skin_tone** — Tư vấn màu theo da: "da ngăm mặc màu gì?", "tông da vàng hợp màu nào?"
5. **style_advice** — Tư vấn outfit/phong cách: "đi hẹn hò mặc gì?", "phối đồ đi làm", "outfit du lịch"
6. **order_status** — Tra đơn hàng: "đơn SF-001 đến đâu?", "check đơn hàng", "kiểm tra đơn"
7. **faq** — Chính sách shop: "ship bao nhiêu?", "đổi trả thế nào?", "thanh toán gì?", "VIP", "bảo hành"
8. **greeting** — Chào hỏi: "xin chào", "hi", "alo", "có ai không?"
9. **out_of_scope** — Ngoài phạm vi: "thời tiết ngày mai?", "bitcoin giá bao nhiêu?", "kể chuyện cười"
10. **general_chat** — Chat chung về thời trang: "trend năm nay?", "màu gì hot?", "phong cách nào đẹp?"

Trả về JSON duy nhất (KHÔNG trả text khác):
{"intent": "<tên_intent>", "confidence": <0.0-1.0>, "entities": {}}

Trong entities, trích xuất thông tin nếu có:
- "query": từ khóa tìm kiếm
- "size": kích cỡ
- "color": màu sắc
- "price_min", "price_max": khoảng giá
- "height_cm", "weight_kg": số đo
- "gender": giới tính
- "occasion": dịp
- "skin_tone": tông da
- "order_code": mã đơn hàng
"""


async def classify_intent(message: str) -> dict:
    """
    Phân loại ý định tin nhắn của khách hàng.

    Trả về:
        {
            "intent": "search_product",
            "confidence": 0.95,
            "entities": {"query": "áo thun nam", "price_max": 300000}
        }
    """
    try:
        llm = ChatGoogleGenerativeAI(
            model=settings.GEMINI_MODEL,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.1,  # Rất thấp — phân loại cần chính xác
            max_output_tokens=256,
        )

        response = await llm.ainvoke([
            SystemMessage(content=_CLASSIFIER_PROMPT),
            HumanMessage(content=f"Tin nhắn khách hàng: \"{message}\""),
        ])

        # Parse JSON response
        content = response.content.strip()

        # Xử lý trường hợp Gemini bọc trong markdown code block
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()

        result = json.loads(content)

        # Validate intent hợp lệ
        intent_value = result.get("intent", "general_chat")
        try:
            Intent(intent_value)
        except ValueError:
            logger.warning(f"Intent không hợp lệ: {intent_value}, fallback general_chat")
            intent_value = "general_chat"

        return {
            "intent": intent_value,
            "confidence": float(result.get("confidence", 0.5)),
            "entities": result.get("entities", {}),
        }

    except json.JSONDecodeError as e:
        logger.warning(f"Không parse được JSON từ classifier: {e}")
        return {
            "intent": "general_chat",
            "confidence": 0.3,
            "entities": {},
        }
    except Exception as e:
        logger.error(f"Lỗi classify_intent: {e}")
        return {
            "intent": "general_chat",
            "confidence": 0.0,
            "entities": {},
        }
