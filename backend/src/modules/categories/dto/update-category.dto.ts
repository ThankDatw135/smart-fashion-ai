import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto.js';

/**
 * DTO cập nhật danh mục — tất cả fields đều optional
 */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
