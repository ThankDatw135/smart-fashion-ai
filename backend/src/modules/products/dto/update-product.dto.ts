import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto.js';

/**
 * DTO cập nhật sản phẩm — tất cả fields optional, bỏ variants (cập nhật riêng)
 */
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['variants'] as const),
) {}
