import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  MaxLength,
  MinLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO tạo yêu cầu đổi/trả — User
 * Schema: ReturnRequest { orderId, userId, type, reason, status }
 */
export class CreateReturnDto {
  @ApiProperty({ description: 'ID đơn hàng cần đổi/trả' })
  @IsString()
  orderId!: string;

  @ApiProperty({
    enum: ['return_item', 'exchange'],
    description: 'Loại yêu cầu: trả hàng hoặc đổi hàng',
  })
  @IsEnum(['return_item', 'exchange'])
  type!: string;

  @ApiProperty({
    example: 'Áo bị rách ở tay phải, giao sai màu so với ảnh',
    description: 'Lý do chi tiết (20-500 ký tự)',
  })
  @IsString()
  @MinLength(20)
  @MaxLength(500)
  reason!: string;
}

/**
 * DTO Admin duyệt/từ chối yêu cầu đổi/trả
 */
export class ProcessReturnDto {
  @ApiProperty({
    enum: ['approved', 'rejected'],
    description: 'Quyết định: duyệt hoặc từ chối',
  })
  @IsEnum(['approved', 'rejected'])
  decision!: 'approved' | 'rejected';

  @ApiPropertyOptional({ description: 'Ghi chú từ Admin' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminNote?: string;

  @ApiPropertyOptional({
    description: 'Số tiền hoàn (VND) — chỉ khi approved',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  refundAmount?: number;
}
