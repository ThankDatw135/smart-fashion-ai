import { IsUUID, IsInt, Min, Max, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO thêm sản phẩm vào giỏ hàng
 */
export class AddCartItemDto {
  @ApiProperty({ description: 'ID sản phẩm', example: 'uuid' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'ID variant (size × color)', example: 'uuid' })
  @IsUUID()
  variantId!: string;

  @ApiProperty({
    description: 'Số lượng',
    example: 1,
    minimum: 1,
    maximum: 20,
  })
  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;
}

/**
 * DTO cập nhật số lượng item trong giỏ
 */
export class UpdateCartItemDto {
  @ApiProperty({
    description: 'Số lượng mới',
    example: 2,
    minimum: 1,
    maximum: 20,
  })
  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;
}

/**
 * DTO merge guest cart vào user cart
 */
export class MergeCartDto {
  @ApiProperty({ description: 'Guest ID từ cookie', example: 'uuid' })
  @IsString()
  guestId!: string;
}
