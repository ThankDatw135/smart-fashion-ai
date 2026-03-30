"""
Pydantic response models dùng chung cho toàn bộ AI Service.

Các schema này định nghĩa cấu trúc request/response chuẩn
để đảm bảo tính nhất quán giữa các module (chat, search, recommendation).
"""

from pydantic import BaseModel, Field
from datetime import datetime


# ─── Health Check ───


class ConnectionStatus(BaseModel):
    """Trạng thái kết nối tới từng service phụ thuộc."""
    database: str = "disconnected"
    redis: str = "disconnected"
    rabbitmq: str = "disconnected"


class KnowledgeStatus(BaseModel):
    """Trạng thái Knowledge Base đã load hay chưa."""
    loaded: bool = False
    files: int = 0


class HealthResponse(BaseModel):
    """Response cho endpoint GET /api/health."""
    status: str = "ok"
    service: str = "ai-service"
    version: str = "1.0.0"
    uptime_seconds: float = 0.0
    connections: ConnectionStatus = ConnectionStatus()
    knowledge_base: KnowledgeStatus = KnowledgeStatus()
    embedding_model: str = "not_loaded"  # "ready" | "not_loaded"


# ─── Error Response (RFC 7807) ───


class ErrorResponse(BaseModel):
    """
    Response lỗi theo chuẩn RFC 7807.

    Ghi chú: Giữ cấu trúc nhất quán với Backend NestJS
    để Frontend chỉ cần 1 error handler.
    """
    error_code: str = Field(..., description="Mã lỗi nội bộ, ví dụ: AI_RATE_LIMITED")
    message: str = Field(..., description="Mô tả lỗi ngắn gọn cho developer")
    details: dict | None = Field(None, description="Chi tiết bổ sung (nếu có)")
    timestamp: str = Field(
        default_factory=lambda: datetime.now().isoformat(),
        description="Thời điểm xảy ra lỗi (ISO 8601)"
    )
    path: str = Field("", description="Đường dẫn API gây lỗi")


# ─── Chat ───


class ChatMessageRequest(BaseModel):
    """Request body cho endpoint POST /api/chat."""
    message: str = Field(..., min_length=1, max_length=2000, description="Nội dung tin nhắn từ người dùng")
    session_id: str | None = Field(None, description="ID phiên chat (tạo mới nếu None)")
    user_id: str | None = Field(None, description="ID người dùng đã đăng nhập (None = khách)")


class ChatStreamEvent(BaseModel):
    """
    Sự kiện streaming cho chat response.

    Các loại event:
    - text: Đoạn text từ LLM
    - product_cards: Danh sách sản phẩm gợi ý
    - quick_replies: Các câu trả lời nhanh gợi ý
    - done: Kết thúc stream
    - error: Lỗi xảy ra trong quá trình xử lý
    """
    type: str = Field(..., description="Loại event: text, product_cards, quick_replies, done, error")
    data: dict | str = Field(..., description="Dữ liệu của event")


class ChatHistoryItem(BaseModel):
    """Một tin nhắn trong lịch sử chat."""
    role: str = Field(..., description="Vai trò: user hoặc assistant")
    content: str = Field(..., description="Nội dung tin nhắn")
    timestamp: str = Field(
        default_factory=lambda: datetime.now().isoformat(),
        description="Thời điểm gửi tin nhắn"
    )


class ChatHistoryResponse(BaseModel):
    """Response cho endpoint GET /api/chat/history/{session_id}."""
    session_id: str
    messages: list[ChatHistoryItem] = []
    total: int = 0
