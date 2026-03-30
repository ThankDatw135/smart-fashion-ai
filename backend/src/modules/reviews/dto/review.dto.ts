import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO tạo review sản phẩm
 */
export class CreateReviewDto {
  @ApiProperty({ description: 'ID sản phẩm' })
  @IsString()
  productId!: string;

  @ApiProperty({ description: 'ID đơn hàng (chứng minh đã mua)' })
  @IsString()
  orderId!: string;

  @ApiProperty({ example: 5, description: 'Số sao (1-5)' })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({
    example: 'Áo đẹp, chất vải mát, đúng size',
    description: 'Bình luận (10-500 ký tự)',
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  comment?: string;
}
