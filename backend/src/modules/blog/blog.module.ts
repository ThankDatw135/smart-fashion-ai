import { Module } from '@nestjs/common';
import {
  AdminBlogController,
  AdminBlogCategoryController,
  PublicBlogController,
} from './blog.controller.js';
import { BlogService } from './blog.service.js';

/**
 * Blog Module — Bài viết & danh mục blog
 */
@Module({
  controllers: [
    AdminBlogController,
    AdminBlogCategoryController,
    PublicBlogController,
  ],
  providers: [BlogService],
  exports: [BlogService],
})
export class BlogModule {}
