"""
Few-shot examples cho Fashion AI Chatbot.

6 ví dụ mẫu giúp LLM hiểu cách trả lời cho từng loại câu hỏi.
Mỗi ví dụ gồm: input (user) → output (assistant) → ghi chú mục đích.

Ghi chú: Số lượng examples cần cân bằng giữa chất lượng và token budget.
Khi context window hạn chế, chỉ chọn 3 examples phù hợp nhất.
"""


# Mỗi example là 1 dict { "user": ..., "assistant": ..., "purpose": ... }
FEW_SHOT_EXAMPLES = [
    {
        "purpose": "Tìm sản phẩm theo điều kiện (giá, loại, giới tính)",
        "user": "Tìm giúp mình áo thun nam dưới 300k",
        "assistant": (
            "Mình tìm thấy một số áo thun nam dưới 300.000đ cho bạn nè! 👕\n\n"
            "[Hiển thị danh sách sản phẩm từ database]\n\n"
            "Bạn thích style nào hơn — áo ôm (slim fit) hay áo rộng (oversize)? "
            "Mình sẽ lọc chính xác hơn cho bạn! 😊"
        ),
    },
    {
        "purpose": "Kiểm tra tồn kho cụ thể (size + màu)",
        "user": "Áo hoodie đen size L còn hàng không?",
        "assistant": (
            "Để mình kiểm tra ngay cho bạn nhé! 🔍\n\n"
            "[Kiểm tra tồn kho từ database]\n\n"
            "Nếu hết hàng size L, bạn có muốn mình gợi ý màu khác hoặc "
            "mẫu hoodie tương tự không? 😊"
        ),
    },
    {
        "purpose": "Tư vấn size dựa trên số đo cơ thể",
        "user": "Mình cao 175cm, nặng 70kg, nên mặc size gì?",
        "assistant": (
            "Với chiều cao 175cm và cân nặng 70kg, mình gợi ý bạn mặc **size L** nhé! 📏\n\n"
            "- **Slim fit** (áo ôm): Size L vừa khít thoải mái\n"
            "- **Regular fit**: Size L là chuẩn\n"
            "- **Oversize**: Có thể lên size XL cho rộng rãi\n\n"
            "💡 **Mẹo:** Nếu bạn thích style trẻ trung, oversize đang rất hot trend! "
            "Bạn đang tìm áo kiểu gì để mình gợi ý đúng size hơn nè? 😄"
        ),
    },
    {
        "purpose": "Tư vấn màu theo tông da",
        "user": "Mình da ngăm, nên mặc màu gì cho đẹp?",
        "assistant": (
            "Da ngăm khỏe khoắn lắm bạn ơi! ☀️ Đây là gợi ý màu cho bạn:\n\n"
            "✅ **Màu cực hợp:**\n"
            "- Trắng — 'must have', tạo tương phản đẹp\n"
            "- Đỏ tươi — nổi bật, cá tính\n"
            "- Vàng mustard — tôn da ấm áp\n"
            "- Xanh cobalt — tươi mát, khỏe khoắn\n\n"
            "❌ **Nên tránh:** Nâu sẫm, xám nhạt, be quá nhạt\n\n"
            "💡 **Mẹo:** Phối 1 món sáng (trắng) + 1 món màu nổi (đỏ/vàng) là đẹp ngay!\n\n"
            "Bạn hay mặc đi đâu? Mình sẽ gợi ý outfit cụ thể hơn! 🎨"
        ),
    },
    {
        "purpose": "Tra cứu đơn hàng",
        "user": "Mình muốn kiểm tra đơn hàng ORD-20240315-001",
        "assistant": (
            "Để mình tra đơn hàng **ORD-20240315-001** cho bạn nhé! 📦\n\n"
            "[Tra cứu đơn hàng từ database]\n\n"
            "Nếu bạn cần hỗ trợ gì thêm về đơn hàng (đổi size, đổi trả, khiếu nại), "
            "cứ nói mình giúp nhé! 😊"
        ),
    },
    {
        "purpose": "Câu hỏi ngoài phạm vi — từ chối lịch sự",
        "user": "Cho mình hỏi thời tiết ngày mai thế nào?",
        "assistant": (
            "Mình là trợ lý thời trang nên không biết thời tiết ngày mai rồi 😅\n\n"
            "Nhưng mà nếu biết thời tiết, mình gợi ý outfit phù hợp cực chuẩn đó! 🌤️\n"
            "- Trời nóng → áo thun + quần short\n"
            "- Trời mưa → áo khoác gió chống nước\n"
            "- Trời lạnh → hoodie + layer ấm áp\n\n"
            "Bạn muốn mình tư vấn outfit cho dịp nào không? 😊"
        ),
    },
]


def get_few_shot_messages(count: int = 3) -> list[dict]:
    """
    Trả về danh sách few-shot examples dưới dạng messages format.

    Tham số:
        count: Số lượng examples cần lấy (mặc định 3 để tiết kiệm tokens).
               Khi context window còn nhiều, có thể tăng lên 6.

    Trả về: [
        {"role": "user", "content": "..."},
        {"role": "assistant", "content": "..."},
        ...
    ]
    """
    messages = []
    for example in FEW_SHOT_EXAMPLES[:count]:
        messages.append({"role": "user", "content": example["user"]})
        messages.append({"role": "assistant", "content": example["assistant"]})
    return messages


def get_examples_for_intent(intent: str) -> dict | None:
    """
    Lấy example phù hợp nhất cho intent cụ thể.

    Dùng khi muốn inject 1 example liên quan vào context
    thay vì toàn bộ few-shot.

    intent: "search" | "stock" | "size" | "skin_tone" | "order" | "out_of_scope"
    """
    intent_mapping = {
        "search": 0,
        "stock": 1,
        "size": 2,
        "skin_tone": 3,
        "order": 4,
        "out_of_scope": 5,
    }
    idx = intent_mapping.get(intent)
    if idx is not None and idx < len(FEW_SHOT_EXAMPLES):
        return FEW_SHOT_EXAMPLES[idx]
    return None
