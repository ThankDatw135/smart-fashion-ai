import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Ghi chú: Vị trí hiển thị banner trên trang chủ
export enum BannerPosition {
  HERO = 'hero', // Banner lớn trên đầu
  SIDEBAR = 'sidebar', // Cột bên
  MIDDLE = 'middle', // Giữa trang
  BOTTOM = 'bottom', // Cuối trang
}

/**
 * DTO tạo banner — Admin only
 * Schema: imageUrl required (upload bắt buộc), không có subtitle
 */
export class CreateBannerDto {
  @ApiProperty({ example: 'Summer Sale 2026' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    description: 'Link khi click vào banner',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkUrl?: string;

  @ApiProperty({
    enum: BannerPosition,
    description: 'Vị trí hiển thị',
    default: BannerPosition.HERO,
  })
  @IsEnum(BannerPosition)
  position!: BannerPosition;

  @ApiPropertyOptional({
    example: 1,
    description: 'Thứ tự hiển thị (số nhỏ = ưu tiên)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Ngày bắt đầu hiển thị',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Ngày kết thúc hiển thị',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

/**
 * DTO cập nhật banner — Admin only
 */
export class UpdateBannerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkUrl?: string;

  @ApiPropertyOptional({ enum: BannerPosition })
  @IsOptional()
  @IsEnum(BannerPosition)
  position?: BannerPosition;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Bật/tắt banner' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
