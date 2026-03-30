"""
Chatbot Tools — 7 tools cho Fashion AI Agent.

Phân loại:
- knowledge_tools: 4 tools đọc JSON cục bộ (size, skin_tone, style, FAQ)
- db_tools: 3 tools đọc DB / mock (search, stock, order)
"""

from src.chatbot.tools.knowledge_tools import (
    get_size_chart,
    skin_tone_advisor,
    suggest_style,
    faq_knowledge,
)
from src.chatbot.tools.db_tools import (
    search_products,
    check_stock,
    get_order_status,
)

ALL_TOOLS = [
    get_size_chart,
    skin_tone_advisor,
    suggest_style,
    faq_knowledge,
    search_products,
    check_stock,
    get_order_status,
]

__all__ = [
    "get_size_chart",
    "skin_tone_advisor",
    "suggest_style",
    "faq_knowledge",
    "search_products",
    "check_stock",
    "get_order_status",
    "ALL_TOOLS",
]
