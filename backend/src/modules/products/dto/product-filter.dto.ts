import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Enum sort — các kiểu sắp xếp sản phẩm
 */
export enum ProductSortEnum {
  NEWEST = 'newest',
  BEST_SELLER = 'best_seller',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  RATING = 'rating',
}

/**
 * DTO filter sản phẩm — dùng cho GET /products
 * Tất cả fields đều optional (query params)
 */
export class ProductFilterDto {
  @ApiPropertyOptional({ description: 'Slug danh mục', example: 'ao-thun' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Giá tối thiểu (VNĐ)', example: 100000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Giá tối đa (VNĐ)', example: 500000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Danh sách sizes (phân cách bởi dấu phẩy)',
    example: 'S,M,L',
  })
  @IsOptional()
  @IsString()
  sizes?: string;

  @ApiPropertyOptional({
    description: 'Danh sách màu (phân cách bởi dấu phẩy)',
    example: 'Đỏ,Đen',
  })
  @IsOptional()
  @IsString()
  colors?: string;

  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm',
    example: 'áo thun nam',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Tag names (phân cách bởi dấu phẩy)',
    example: 'new,best-seller',
  })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({
    description: 'Kiểu sắp xếp',
    enum: ProductSortEnum,
    default: ProductSortEnum.NEWEST,
  })
  @IsOptional()
  @IsEnum(ProductSortEnum)
  sort?: ProductSortEnum;

  @ApiPropertyOptional({ description: 'Cursor phân trang (base64 encoded ID)' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Số sản phẩm mỗi trang',
    default: 20,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;
}
