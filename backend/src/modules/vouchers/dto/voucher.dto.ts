import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VoucherType, VipTier } from '@prisma/client';

/**
 * DTO tạo voucher — Admin only
 */
export class CreateVoucherDto {
  @ApiProperty({
    example: 'SALE20',
    description: 'Mã voucher (in hoa, unique)',
  })
  @IsString()
  @MaxLength(20)
  code!: string;

  @ApiProperty({ enum: VoucherType, example: 'percent' })
  @IsEnum(VoucherType)
  type!: VoucherType;

  @ApiProperty({ example: 10, description: 'Giá trị giảm (% hoặc VND)' })
  @IsNumber()
  @Min(0)
  value!: number;

  @ApiProperty({
    example: 200000,
    description: 'Đơn tối thiểu để áp dụng (VND)',
  })
  @IsNumber()
  @Min(0)
  minOrderValue!: number;

  @ApiPropertyOptional({
    example: 100000,
    description: 'Giảm tối đa (cho type %)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Giới hạn lượt sử dụng (NULL = unlimited)',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @ApiPropertyOptional({
    enum: VipTier,
    description: 'Chỉ dành cho VIP tier (NULL = tất cả)',
  })
  @IsOptional()
  @IsEnum(VipTier)
  vipOnly?: VipTier;

  @ApiProperty({
    example: '2026-04-01T00:00:00Z',
    description: 'Ngày bắt đầu',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    example: '2026-04-30T23:59:59Z',
    description: 'Ngày kết thúc',
  })
  @IsDateString()
  endDate!: string;
}

/**
 * DTO cập nhật voucher — Admin only
 */
export class UpdateVoucherDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Bật/tắt voucher' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
