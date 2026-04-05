import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../infrastructure/redis/redis.service.js';
import { CACHE_KEYS } from '../../common/constants/cache-keys.js';
import { CreateReviewDto } from './dto/index.js';
import { QUEUE_NAMES } from '../../common/constants/queue-names.js';

/**
 * Reviews Service — Đánh giá sản phẩm
 * - Tạo review + upload ảnh
 * - BullMQ job cập nhật avgRating
 * - Xóa review của chính user
 * - Invalidate Redis cache sản phẩm khi có review mới/xóa
 * - Public listing reviews (cursor pagination)
 */
@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);
  private readonly uploadDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @InjectQueue(QUEUE_NAMES.MAIL) private readonly mailQueue: Queue,
  ) {
    // Ghi chú: Folder upload ảnh review nằm ở root monorepo
    this.uploadDir = path.resolve(process.cwd(), '..', 'uploads', 'reviews');
    this.ensureDir(this.uploadDir);
  }

  // ===========================================================================
  // CRUD
  // ===========================================================================

  /**
   * Tạo review — validate quyền sở hữu order + order completed
   */
  async create(
    dto: CreateReviewDto,
    userId: string,
    files?: Express.Multer.File[],
  ) {
    // 1. Check order thuộc user và đã completed
    const order = await this.prisma.order.findFirst({
      where: {
        id: dto.orderId,
        userId,
        status: 'completed',
      },
      include: {
        items: { select: { productId: true } },
      },
    });

    if (!order) {
      throw new BadRequestException(
        'Đơn hàng không tồn tại, không thuộc bạn, hoặc chưa hoàn thành',
      );
    }

    // 2. Check sản phẩm có trong đơn hàng
    const hasProduct = order.items.some(
      (item) => item.productId === dto.productId,
    );
    if (!hasProduct) {
      throw new BadRequestException('Sản phẩm không có trong đơn hàng này');
    }

    // 3. Check chưa review sản phẩm này trong đơn
    const existing = await this.prisma.review.findFirst({
      where: {
        userId,
        productId: dto.productId,
        orderId: dto.orderId,
      },
    });
    if (existing) {
      throw new BadRequestException(
        'Bạn đã đánh giá sản phẩm này trong đơn hàng này',
      );
    }

    // 4. Upload ảnh review (nếu có)
    const imageUrls = files?.length ? await this.uploadReviewImages(files) : [];

    // 5. Tạo review + ảnh trong transaction
    const review = await this.prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          userId,
          productId: dto.productId,
          orderId: dto.orderId,
          rating: dto.rating,
          comment: dto.comment ?? null,
        },
      });

      // Tạo review images
      if (imageUrls.length > 0) {
        await tx.reviewImage.createMany({
          data: imageUrls.map((url, index) => ({
            reviewId: newReview.id,
            imageUrl: url,
            sortOrder: index,
          })),
        });
      }

      return newReview;
    });

    // 6. BullMQ job: update avgRating + reviewCount (async)
    await this.mailQueue.add('update-product-rating', {
      productId: dto.productId,
    });

    // 7. Invalidate Redis cache — SP detail chứa avgRating + reviewCount
    await this.invalidateProductCache(dto.productId);

    // 8. Notify admin: review mới
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: { name: true },
    });

    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['admin', 'super_admin'] } },
      select: { id: true },
    });

    if (admins.length > 0) {
      await this.prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: 'system' as const,
          title: `⭐ Review mới ${dto.rating}⭐`,
          message: `"${product?.name}" nhận được đánh giá ${dto.rating} sao`,
          data: { reviewId: review.id, productId: dto.productId },
          channel: 'in_app' as const,
        })),
      });
    }

    this.logger.log(`Review mới: ${product?.name} — ${dto.rating}⭐`);

    return {
      ...review,
      images: imageUrls.map((url, i) => ({ imageUrl: url, sortOrder: i })),
    };
  }

  /**
   * Xóa review — chỉ user tạo mới được xóa
   */
  async delete(reviewId: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review không tồn tại');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa review này');
    }

    await this.prisma.review.delete({ where: { id: reviewId } });

    // Recalculate rating
    await this.mailQueue.add('update-product-rating', {
      productId: review.productId,
    });

    // Invalidate cache
    await this.invalidateProductCache(review.productId);

    return { message: 'Đã xóa review' };
  }

  // ===========================================================================
  // PUBLIC — DANH SÁCH REVIEW (Cursor Pagination)
  // ===========================================================================

  /**
   * Lấy danh sách review của sản phẩm
   * Cursor-based pagination, sort theo mới nhất
   */
  async findByProduct(
    productId: string,
    params: { cursor?: string; limit?: number; rating?: number },
  ) {
    const { cursor, limit = 10, rating } = params;

    // Kiểm tra sản phẩm tồn tại
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    // Build where clause
    const where: Record<string, unknown> = { productId };
    if (rating) where.rating = rating;

    const reviews = await this.prisma.review.findMany({
      where,
      take: limit + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        images: {
          select: { imageUrl: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    const hasNext = reviews.length > limit;
    const items = hasNext ? reviews.slice(0, limit) : reviews;
    const nextCursor = hasNext ? items[items.length - 1]?.id : null;

    // Thống kê rating distribution
    const stats = await this.prisma.review.groupBy({
      by: ['rating'],
      where: { productId },
      _count: { id: true },
    });

    const ratingDistribution = [1, 2, 3, 4, 5].map((r) => ({
      rating: r,
      count: stats.find((s) => s.rating === r)?._count.id ?? 0,
    }));

    return {
      items,
      pagination: { hasNext, nextCursor },
      stats: { ratingDistribution },
    };
  }

  // ===========================================================================
  // INVALIDATE CACHE
  // ===========================================================================

  /**
   * Xóa cache sản phẩm khi avgRating/reviewCount thay đổi
   * Tìm slug từ productId → del cache detail + related
   */
  private async invalidateProductCache(productId: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { slug: true },
      });

      if (product) {
        await Promise.all([
          this.redis.del(CACHE_KEYS.PRODUCT_DETAIL(product.slug)),
          this.redis.del(CACHE_KEYS.PRODUCT_RELATED(product.slug)),
        ]);
        this.logger.debug(`Cache invalidated: product ${product.slug}`);
      }
    } catch (error) {
      // Non-critical — log mà không throw
      this.logger.warn(
        `Cache invalidation failed for product ${productId}: ${(error as Error).message}`,
      );
    }
  }

  // ===========================================================================
  // UPLOAD ẢNH REVIEW
  // ===========================================================================

  /**
   * Upload + resize ảnh review (max 5 ảnh, WebP)
   */
  private async uploadReviewImages(
    files: Express.Multer.File[],
  ): Promise<string[]> {
    if (files.length > 5) {
      throw new BadRequestException('Tối đa 5 ảnh cho mỗi review');
    }

    const urls: string[] = [];

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('Kích thước ảnh tối đa 5MB');
      }

      const hash = crypto.randomBytes(8).toString('hex');
      const filename = `${Date.now()}-${hash}.webp`;
      const filepath = path.join(this.uploadDir, filename);

      await (sharp as any)(file.buffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(filepath);

      urls.push(`/uploads/reviews/${filename}`);
    }

    return urls;
  }

  /**
   * Tạo thư mục nếu chưa có
   */
  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
