import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { ImageUploadService } from './image-upload.service.js';
import { TagsController } from './tags.controller.js';
import { TagsService } from './tags.service.js';
import { ReviewsController } from './reviews.controller.js';

/**
 * Products Module — quản lý sản phẩm, variants, tags, upload ảnh
 * PrismaModule, RedisModule, RabbitmqModule đã là Global → không cần import
 */
@Module({
  imports: [
    // Multer dùng memory storage — sharp sẽ xử lý buffer trực tiếp
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  ],
  controllers: [ProductsController, TagsController, ReviewsController],
  providers: [ProductsService, ImageUploadService, TagsService],
  exports: [ProductsService],
})
export class ProductsModule {}
