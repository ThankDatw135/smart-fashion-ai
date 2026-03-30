import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO tạo bài viết blog — Admin only
 * Schema: categoryId required, isPublished boolean
 */
export class CreateBlogPostDto {
  @ApiProperty({
    example: 'Xu hướng thời trang Xuân Hè 2026',
    description: 'Tiêu đề bài viết',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    description: 'Slug URL (tự tạo nếu không truyền)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @ApiProperty({ description: 'Nội dung bài viết (HTML/Markdown)' })
  @IsString()
  @MinLength(50)
  content!: string;

  @ApiPropertyOptional({ description: 'Tóm tắt ngắn (SEO)' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  excerpt?: string;

  @ApiProperty({ description: 'ID danh mục blog (required)' })
  @IsString()
  categoryId!: string;

  @ApiPropertyOptional({
    enum: ['draft', 'published'],
    description: 'Trạng thái bài viết',
    default: 'draft',
  })
  @IsOptional()
  @IsEnum(['draft', 'published'])
  status?: string;
}

/**
 * DTO cập nhật bài viết — Admin only
 */
export class UpdateBlogPostDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  excerpt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ enum: ['draft', 'published'] })
  @IsOptional()
  @IsEnum(['draft', 'published'])
  status?: string;
}

/**
 * DTO tạo danh mục blog — Admin only
 * Schema: BlogCategory không có description
 */
export class CreateBlogCategoryDto {
  @ApiProperty({ example: 'Xu hướng' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ description: 'Slug URL' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  slug?: string;
}

/**
 * DTO cập nhật danh mục blog
 */
export class UpdateBlogCategoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;
}
