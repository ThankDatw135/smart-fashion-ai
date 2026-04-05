import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  INTERNAL_SERVER_ERROR,
  VALIDATION_ERROR,
} from '../constants/error-codes.js';
import type { ApiErrorDto } from '../dto/api-response.dto.js';

/**
 * Global Exception Filter — chuyển đổi tất cả exception thành RFC 7807 format
 * Đảm bảo client luôn nhận được response có cấu trúc nhất quán
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = INTERNAL_SERVER_ERROR;
    let message = 'Đã xảy ra lỗi không mong muốn';
    let details: Record<string, unknown> | string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>;
        errorCode =
          (res['errorCode'] as string) || this.getDefaultErrorCode(status);
        message = (res['message'] as string) || exception.message;

        // class-validator trả về mảng message
        if (Array.isArray(res['message'])) {
          errorCode = VALIDATION_ERROR;
          message = 'Dữ liệu không hợp lệ';
          details = res['message'] as string[];
        }
      } else {
        message = exceptionResponse;
        errorCode = this.getDefaultErrorCode(status);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      // Ghi log lỗi không mong đợi (500)
      this.logger.error(
        `Lỗi không mong đợi: ${exception.message}`,
        exception.stack,
      );
    }

    const errorResponse: ApiErrorDto = {
      success: false,
      errorCode,
      message,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }

  /**
   * Map HTTP status code sang error code mặc định
   */
  private getDefaultErrorCode(status: number): string {
    const map: Record<number, string> = {
      400: VALIDATION_ERROR,
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      429: 'RATE_LIMIT_EXCEEDED',
    };
    return map[status] || INTERNAL_SERVER_ERROR;
  }
}
