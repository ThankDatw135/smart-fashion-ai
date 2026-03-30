"""
Custom exceptions và error handlers cho AI Service.

Tuân thủ chuẩn RFC 7807 — đồng bộ format lỗi với Backend NestJS.
Mỗi exception có error_code riêng để Frontend dễ xử lý.
"""

from fastapi import Request
from fastapi.responses import JSONResponse
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


# ─── Base Exception ───


class AIServiceError(Exception):
    """
    Exception gốc cho toàn bộ AI Service.

    Tất cả custom exception phải kế thừa từ class này
    để error handler có thể bắt được.
    """
    def __init__(
        self,
        message: str = "Đã xảy ra lỗi trong AI Service.",
        error_code: str = "AI_INTERNAL_ERROR",
        status_code: int = 500,
        details: dict | None = None,
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details
        super().__init__(self.message)


# ─── Các exception cụ thể ───


class LLMError(AIServiceError):
    """Lỗi khi gọi Google Gemini API (timeout, quota, invalid response)."""
    def __init__(self, message: str = "Lỗi khi gọi mô hình AI.", details: dict | None = None):
        super().__init__(
            message=message,
            error_code="AI_LLM_ERROR",
            status_code=502,
            details=details,
        )


class KnowledgeNotFoundError(AIServiceError):
    """Lỗi khi không tìm thấy file knowledge base cần thiết."""
    def __init__(self, message: str = "Không tìm thấy dữ liệu knowledge base.", details: dict | None = None):
        super().__init__(
            message=message,
            error_code="AI_KNOWLEDGE_NOT_FOUND",
            status_code=500,
            details=details,
        )


class RateLimitExceededError(AIServiceError):
    """Lỗi khi người dùng gửi quá nhiều tin nhắn (rate limit)."""
    def __init__(self, message: str = "Bạn đã gửi quá nhiều tin nhắn. Vui lòng thử lại sau.", details: dict | None = None):
        super().__init__(
            message=message,
            error_code="AI_RATE_LIMITED",
            status_code=429,
            details=details,
        )


class DatabaseConnectionError(AIServiceError):
    """Lỗi khi không thể kết nối tới database."""
    def __init__(self, message: str = "Không thể kết nối tới cơ sở dữ liệu.", details: dict | None = None):
        super().__init__(
            message=message,
            error_code="AI_DB_CONNECTION_ERROR",
            status_code=503,
            details=details,
        )


class SessionNotFoundError(AIServiceError):
    """Lỗi khi không tìm thấy phiên chat."""
    def __init__(self, session_id: str):
        super().__init__(
            message=f"Không tìm thấy phiên chat: {session_id}",
            error_code="AI_SESSION_NOT_FOUND",
            status_code=404,
            details={"session_id": session_id},
        )


# ─── Error Handlers — đăng ký vào FastAPI app ───


async def ai_service_error_handler(request: Request, exc: AIServiceError) -> JSONResponse:
    """
    Handler cho tất cả AIServiceError.
    Trả về JSON theo chuẩn RFC 7807.
    """
    logger.error(f"[{exc.error_code}] {exc.message} | Path: {request.url.path} | Details: {exc.details}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": exc.error_code,
            "message": exc.message,
            "details": exc.details,
            "timestamp": datetime.now().isoformat(),
            "path": str(request.url.path),
        },
    )


async def generic_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handler cho các exception không mong đợi (fallback).
    Ghi log đầy đủ nhưng chỉ trả thông tin tối thiểu cho client.
    """
    logger.exception(f"Lỗi không mong đợi tại {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error_code": "AI_INTERNAL_ERROR",
            "message": "Đã xảy ra lỗi không mong đợi. Vui lòng thử lại sau.",
            "details": None,
            "timestamp": datetime.now().isoformat(),
            "path": str(request.url.path),
        },
    )
