import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { PRODUCT_IMAGE_UPLOAD_FAILED } from '../../common/constants/error-codes.js';

// Ghi chú: Các format ảnh được phép upload
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Image Upload Service — xử lý upload + resize + optimize ảnh sản phẩm
 * Dev: lưu local tại /uploads/admin/products/
 * Prod: sẽ chuyển sang Cloudinary (toggle qua env)
 */
@Injectable()
export class ImageUploadService {
  private readonly logger = new Logger(ImageUploadService.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    // Thư mục upload gốc — relative to project root
    this.uploadDir = path.resolve(
      process.cwd(),
      '..',
      'uploads',
      'admin',
      'products',
    );
    this.baseUrl = this.configService.get<string>(
      'app.baseUrl',
      'http://localhost:4000',
    );

    // Tạo thư mục nếu chưa có
    this.ensureDir(this.uploadDir);
  }

  /**
   * Upload nhiều ảnh sản phẩm — resize + convert WebP
   * @returns Mảng URL ảnh đã upload
   */
  async uploadProductImages(files: Express.Multer.File[]): Promise<string[]> {
    const urls: string[] = [];

    for (const file of files) {
      // 1. Validate
      this.validateFile(file);

      // 2. Generate unique filename
      const hash = crypto.randomBytes(8).toString('hex');
      const filename = `${Date.now()}-${hash}.webp`;
      const filepath = path.join(this.uploadDir, filename);

      try {
        // 3. Resize + convert WebP bằng sharp
        await sharp(file.buffer)
          .resize(800, 800, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: 85 })
          .toFile(filepath);

        // 4. Build URL
        const url = `/uploads/admin/products/${filename}`;
        urls.push(url);

        this.logger.debug(`Ảnh uploaded: ${filename}`);
      } catch (error) {
        this.logger.error(`Lỗi upload ảnh: ${(error as Error).message}`);
        throw new BadRequestException(PRODUCT_IMAGE_UPLOAD_FAILED);
      }
    }

    return urls;
  }

  /**
   * Xóa ảnh theo URL (dùng khi admin thay ảnh)
   */
  deleteImage(imageUrl: string): void {
    try {
      // URL format: /uploads/admin/products/xxx.webp
      const filename = path.basename(imageUrl);
      const filepath = path.join(this.uploadDir, filename);

      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        this.logger.debug(`Ảnh đã xóa: ${filename}`);
      }
    } catch (error) {
      this.logger.warn(`Không thể xóa ảnh: ${(error as Error).message}`);
    }
  }

  // ===========================================================================
  // HELPER
  // ===========================================================================

  /**
   * Validate file upload
   */
  private validateFile(file: Express.Multer.File): void {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Chỉ chấp nhận ảnh định dạng JPEG, PNG, WebP, GIF',
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Kích thước ảnh tối đa 5MB');
    }
  }

  /**
   * Tạo thư mục nếu chưa tồn tại (recursive)
   */
  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      this.logger.log(`Thư mục upload đã tạo: ${dir}`);
    }
  }
}
