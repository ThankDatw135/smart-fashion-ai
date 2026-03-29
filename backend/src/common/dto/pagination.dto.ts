import { IsOptional, IsString } from 'class-validator';

/**
 * DTO phân trang cursor-based — hiệu quả hơn offset cho dữ liệu lớn
 * Client gửi cursor (base64 encoded) và limit
 */
export class CursorPaginationDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  limit?: number = 20;
}

/**
 * Meta phân trang trả về cho client
 */
export interface PaginationMeta {
  hasMore: boolean;
  nextCursor: string | null;
  total?: number;
}
