"""
Fashion AI Agent — LangGraph State Machine.

Kiến trúc:
    User message → CLASSIFY → TOOL_CALL → GENERATE → SSE Stream

State Machine gồm 3 nodes:
1. classify_node: Phân loại ý định (intent) bằng Gemini
2. tool_node: Gọi tool phù hợp để lấy dữ liệu
3. generate_node: Tổng hợp kết quả và sinh câu trả lời

Giới hạn: Max 3 vòng lặp tool-calling (tránh treo bot).
Fallback: Khi Gemini lỗi → trả câu trả lời cố định.
"""

import json
import logging
from typing import TypedDict, Annotated, Any

from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

from src.config import settings
from src.knowledge.loader import knowledge_base
from src.chatbot.intent import classify_intent, Intent, INTENT_TO_TOOL
from src.chatbot.prompts.system_prompt import get_system_prompt
from src.chatbot.prompts.few_shot_examples import get_few_shot_messages
from src.chatbot.tools import (
    get_size_chart,
    skin_tone_advisor,
    suggest_style,
    faq_knowledge,
    search_products,
    check_stock,
    get_order_status,
)

logger = logging.getLogger(__name__)

# Giới hạn số vòng lặp tool-calling (đã duyệt: 3)
MAX_TOOL_ITERATIONS = 3

# Fallback message khi Gemini API lỗi
FALLBACK_MESSAGE = (
    "Xin lỗi bạn, mình đang gặp chút trục trặc kỹ thuật 😅\n\n"
    "Bạn vui lòng thử lại sau vài giây, hoặc liên hệ:\n"
    "📞 Hotline: 0123-456-789\n"
    "💬 Inbox fanpage: Smart Fashion Store\n\n"
    "Mình sẽ sẵn sàng hỗ trợ bạn ngay khi có thể! 🙏"
)


# ─── Agent State ───


class AgentState(TypedDict):
    """Trạng thái của agent qua các node."""
    # Input
    user_message: str
    session_id: str
    user_id: str | None
    chat_history: list[dict]

    # Processing
    intent: str
    confidence: float
    entities: dict
    tool_name: str | None
    tool_result: str | None
    tool_iterations: int

    # Output
    response_text: str
    response_type: str  # "text", "product_cards", "error"
    products: list[dict] | None  # Sản phẩm gợi ý (nếu có)


# ─── Ánh xạ tool name → tool function ───

_TOOL_MAP = {
    "get_size_chart": get_size_chart,
    "skin_tone_advisor": skin_tone_advisor,
    "suggest_style": suggest_style,
    "faq_knowledge": faq_knowledge,
    "search_products": search_products,
    "check_stock": check_stock,
    "get_order_status": get_order_status,
}


# ─── Node 1: Phân loại ý định ───


async def classify_node(state: AgentState) -> dict:
    """
    Phân loại ý định tin nhắn khách hàng.

    Gọi Gemini classifier → trả về intent + entities.
    Nếu intent cần tool → set tool_name.
    """
    logger.info(f"🔍 Classify: '{state['user_message'][:50]}...'")

    result = await classify_intent(state["user_message"])

    intent = result["intent"]
    tool_name = INTENT_TO_TOOL.get(Intent(intent)) if intent in [e.value for e in Intent] else None

    logger.info(f"📌 Intent: {intent} (confidence: {result['confidence']:.2f}), Tool: {tool_name}")

    return {
        "intent": intent,
        "confidence": result["confidence"],
        "entities": result.get("entities", {}),
        "tool_name": tool_name,
    }


# ─── Node 2: Gọi Tool ───


async def tool_node(state: AgentState) -> dict:
    """
    Gọi tool phù hợp dựa trên intent đã phân loại.

    Đọc entities từ classifier để truyền tham số.
    Nếu tool lỗi → trả fallback result.
    """
    tool_name = state.get("tool_name")
    entities = state.get("entities", {})
    iteration = state.get("tool_iterations", 0)

    if not tool_name or tool_name not in _TOOL_MAP:
        logger.info(f"⏭️ Không cần tool cho intent: {state['intent']}")
        return {"tool_result": None, "tool_iterations": iteration}

    if iteration >= MAX_TOOL_ITERATIONS:
        logger.warning(f"⚠️ Đạt giới hạn {MAX_TOOL_ITERATIONS} vòng lặp tool")
        return {
            "tool_result": json.dumps({
                "error": "Đã thử quá nhiều lần. Xin lỗi bạn.",
            }, ensure_ascii=False),
            "tool_iterations": iteration,
        }

    logger.info(f"🔧 Gọi tool: {tool_name} với entities: {entities}")

    tool_fn = _TOOL_MAP[tool_name]

    try:
        # Xây dựng keyword args từ entities
        kwargs = _build_tool_kwargs(tool_name, entities, state["user_message"])
        result = await tool_fn.ainvoke(kwargs)

        logger.info(f"✅ Tool {tool_name} trả về: {str(result)[:200]}...")
        return {
            "tool_result": result,
            "tool_iterations": iteration + 1,
        }

    except Exception as e:
        logger.error(f"❌ Tool {tool_name} lỗi: {e}")
        return {
            "tool_result": json.dumps({
                "error": f"Tool {tool_name} gặp lỗi: {str(e)}",
            }, ensure_ascii=False),
            "tool_iterations": iteration + 1,
        }


def _build_tool_kwargs(tool_name: str, entities: dict, user_message: str) -> dict:
    """Xây dựng keyword arguments cho từng tool dựa trên entities."""

    if tool_name == "search_products":
        return {
            "query": entities.get("query", user_message),
            "min_price": entities.get("price_min", 0),
            "max_price": entities.get("price_max", 10_000_000),
        }

    elif tool_name == "check_stock":
        return {
            "product_name": entities.get("query", user_message),
            "size": entities.get("size", ""),
            "color": entities.get("color", ""),
        }

    elif tool_name == "get_size_chart":
        return {
            "height_cm": entities.get("height_cm", 170),
            "weight_kg": entities.get("weight_kg", 65),
            "gender": entities.get("gender", "male"),
        }

    elif tool_name == "skin_tone_advisor":
        return {
            "skin_tone_description": entities.get("skin_tone", user_message),
        }

    elif tool_name == "suggest_style":
        return {
            "occasion": entities.get("occasion", user_message),
            "gender": entities.get("gender", "male"),
        }

    elif tool_name == "get_order_status":
        return {
            "order_code": entities.get("order_code", user_message),
        }

    elif tool_name == "faq_knowledge":
        return {
            "query": entities.get("query", user_message),
        }

    return {"query": user_message}


# ─── Node 3: Sinh câu trả lời ───


async def generate_node(state: AgentState) -> dict:
    """
    Tổng hợp kết quả từ tool và sinh câu trả lời hoàn chỉnh.

    Nếu intent là greeting/out_of_scope → trả lời trực tiếp.
    Nếu có tool_result → đưa vào context để LLM tổng hợp.
    """
    intent = state["intent"]
    tool_result = state.get("tool_result")
    user_message = state["user_message"]
    chat_history = state.get("chat_history", [])

    # Trường hợp greeting — trả lời nhanh không cần LLM
    if intent == Intent.GREETING.value:
        return {
            "response_text": (
                "Xin chào bạn! 👋 Mình là Fashion AI — trợ lý thời trang của Smart Fashion Store.\n\n"
                "Mình có thể giúp bạn:\n"
                "🔍 Tìm sản phẩm phù hợp\n"
                "📏 Tư vấn size theo chiều cao/cân nặng\n"
                "🎨 Gợi ý màu sắc theo tông da\n"
                "👔 Gợi ý outfit cho mọi dịp\n"
                "📦 Tra cứu đơn hàng\n\n"
                "Bạn cần mình giúp gì nào? 😊"
            ),
            "response_type": "text",
            "products": None,
        }

    # Xây dựng messages cho LLM
    try:
        llm = ChatGoogleGenerativeAI(
            model=settings.GEMINI_MODEL,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.3,  # Đã duyệt: tự nhiên nhưng chính xác
            max_output_tokens=1024,
        )

        # System prompt + knowledge context
        knowledge_summary = knowledge_base.get_context_summary()
        system_prompt = get_system_prompt(knowledge_summary)

        messages = [SystemMessage(content=system_prompt)]

        # Few-shot examples (3 cái)
        few_shots = get_few_shot_messages(count=3)
        for fs in few_shots:
            if fs["role"] == "user":
                messages.append(HumanMessage(content=fs["content"]))
            else:
                from langchain_core.messages import AIMessage
                messages.append(AIMessage(content=fs["content"]))

        # Chat history (tối đa 10 messages gần nhất)
        for msg in chat_history[-10:]:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            else:
                from langchain_core.messages import AIMessage
                messages.append(AIMessage(content=msg["content"]))

        # Xây dựng final user message kèm tool result
        if tool_result:
            final_message = (
                f"Khách hàng hỏi: \"{user_message}\"\n\n"
                f"Dữ liệu từ hệ thống (tool: {state.get('tool_name', 'unknown')}):\n"
                f"```json\n{tool_result}\n```\n\n"
                f"Hãy tổng hợp dữ liệu trên và trả lời khách hàng một cách tự nhiên, "
                f"thân thiện. Nếu có sản phẩm, hãy trình bày rõ ràng với tên, giá, "
                f"và thông tin quan trọng."
            )
        else:
            final_message = user_message

        messages.append(HumanMessage(content=final_message))

        # Gọi LLM
        response = await llm.ainvoke(messages)
        response_text = response.content

        # Kiểm tra xem tool_result có chứa products không
        products = None
        response_type = "text"
        if tool_result:
            try:
                tool_data = json.loads(tool_result)
                if "products" in tool_data and tool_data.get("found"):
                    products = tool_data["products"]
                    response_type = "product_cards"
            except (json.JSONDecodeError, TypeError):
                pass

        logger.info(f"✅ Generate: {len(response_text)} chars, type={response_type}")
        return {
            "response_text": response_text,
            "response_type": response_type,
            "products": products,
        }

    except Exception as e:
        logger.error(f"❌ Generate lỗi: {e}")
        return {
            "response_text": FALLBACK_MESSAGE,
            "response_type": "error",
            "products": None,
        }


# ─── Router function: quyết định đi tool hay generate ───


def should_use_tool(state: AgentState) -> str:
    """Quyết định node tiếp theo sau classify."""
    tool_name = state.get("tool_name")
    intent = state.get("intent", "")

    # Nếu có tool cần gọi → đi tool_node
    if tool_name and tool_name in _TOOL_MAP:
        return "tool_node"

    # Nếu không cần tool → đi thẳng generate
    return "generate_node"


# ─── Build Graph ───


def build_agent_graph() -> StateGraph:
    """
    Xây dựng LangGraph state machine cho Fashion AI Chatbot.

    Flow: classify → (tool | generate) → generate → END
    """
    graph = StateGraph(AgentState)

    # Add nodes
    graph.add_node("classify_node", classify_node)
    graph.add_node("tool_node", tool_node)
    graph.add_node("generate_node", generate_node)

    # Set entry point
    graph.set_entry_point("classify_node")

    # Conditional edge: classify → tool hoặc generate
    graph.add_conditional_edges(
        "classify_node",
        should_use_tool,
        {
            "tool_node": "tool_node",
            "generate_node": "generate_node",
        },
    )

    # tool → generate
    graph.add_edge("tool_node", "generate_node")

    # generate → END
    graph.add_edge("generate_node", END)

    return graph.compile()


# ─── Module-level compiled graph ───

agent_graph = build_agent_graph()


async def run_agent(
    user_message: str,
    session_id: str,
    user_id: str | None = None,
    chat_history: list[dict] | None = None,
) -> dict:
    """
    Chạy agent pipeline hoàn chỉnh.

    Đầu vào: tin nhắn user + context
    Đầu ra: {
        "response_text": "...",
        "response_type": "text" | "product_cards" | "error",
        "products": [...] | None,
        "intent": "search_product",
        "tool_used": "search_products" | None,
    }
    """
    initial_state: AgentState = {
        "user_message": user_message,
        "session_id": session_id,
        "user_id": user_id,
        "chat_history": chat_history or [],
        "intent": "",
        "confidence": 0.0,
        "entities": {},
        "tool_name": None,
        "tool_result": None,
        "tool_iterations": 0,
        "response_text": "",
        "response_type": "text",
        "products": None,
    }

    try:
        result = await agent_graph.ainvoke(initial_state)

        return {
            "response_text": result.get("response_text", FALLBACK_MESSAGE),
            "response_type": result.get("response_type", "text"),
            "products": result.get("products"),
            "intent": result.get("intent", "unknown"),
            "tool_used": result.get("tool_name"),
        }

    except Exception as e:
        logger.error(f"❌ Agent pipeline lỗi: {e}")
        return {
            "response_text": FALLBACK_MESSAGE,
            "response_type": "error",
            "products": None,
            "intent": "error",
            "tool_used": None,
        }
