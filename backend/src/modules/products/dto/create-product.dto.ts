import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO variant lồng trong CreateProductDto
 */
export class CreateVariantDto {
  @ApiProperty({ description: 'Size sản phẩm', example: 'M' })
  @IsString()
  @MaxLength(10)
  size!: string;

  @ApiProperty({ description: 'Tên màu sắc', example: 'Đỏ' })
  @IsString()
  @MaxLength(50)
  color!: string;

  @ApiPropertyOptional({ description: 'Mã màu HEX', example: '#FF4444' })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  colorCode?: string;

  @ApiProperty({ description: 'Số lượng tồn kho', example: 15, minimum: 0 })
  @IsNumber()
  @Min(0)
  stockQuantity!: number;
}

/**
 * DTO tạo sản phẩm mới — Admin only
 * Bao gồm: thông tin chính + danh sách variants + tag IDs
 * Ảnh upload riêng qua multer (multipart/form-data)
 */
export class CreateProductDto {
  @ApiProperty({
    description: 'Tên sản phẩm (VI)',
    example: 'Áo Thun Nam Cổ Tròn',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    description: 'Tên tiếng Anh',
    example: 'Men Crew Neck T-Shirt',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nameEn?: string;

  @ApiPropertyOptional({ description: 'Mô tả sản phẩm (VI)' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Mô tả tiếng Anh' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiProperty({ description: 'Giá gốc (VNĐ)', example: 299000 })
  @IsNumber()
  @Min(1000)
  price!: number;

  @ApiPropertyOptional({ description: 'Giá sale (VNĐ)', example: 199000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @ApiProperty({ description: 'ID danh mục' })
  @IsUUID()
  categoryId!: string;

  @ApiPropertyOptional({ description: 'Chất liệu', example: 'Cotton 100%' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  material?: string;

  @ApiPropertyOptional({ description: 'Thương hiệu', example: 'Smart Fashion' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiPropertyOptional({ description: 'Bảng size (JSON)' })
  @IsOptional()
  sizeChart?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Sản phẩm nổi bật', default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty({
    description: 'Danh sách variants (size × color × stock)',
    type: [CreateVariantDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants!: CreateVariantDto[];

  @ApiPropertyOptional({
    description: 'Danh sách tag IDs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
