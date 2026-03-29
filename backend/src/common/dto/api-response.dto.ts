/**
 * DTO response chuẩn — mọi API đều trả về format này
 */
export interface ApiResponseDto<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
  timestamp: string;
}

/**
 * DTO lỗi chuẩn RFC 7807 — Problem Details for HTTP APIs
 */
export interface ApiErrorDto {
  success: false;
  errorCode: string;
  message: string;
  details?: Record<string, unknown> | string[];
  timestamp: string;
  path: string;
}
