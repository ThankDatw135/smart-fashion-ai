import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, resolve } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

/**
 * Users Module — quản lý hồ sơ người dùng
 * Cấu hình Multer cho upload avatar (lưu disk tạm thời, production → Cloudinary)
 */
@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        // Ghi chú: Dùng chung folder uploads/ ở root monorepo
        destination: resolve(process.cwd(), '..', 'uploads', 'avatars'),
        filename: (_req, file, cb) => {
          // Tạo tên file duy nhất: UUID + extension gốc
          const ext = extname(file.originalname);
          cb(null, `${uuidv4()}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
      },
      fileFilter: (_req, file, cb) => {
        // Chỉ chấp nhận ảnh
        if (!file.mimetype.startsWith('image/')) {
          cb(new Error('Chỉ chấp nhận file ảnh'), false);
          return;
        }
        cb(null, true);
      },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
