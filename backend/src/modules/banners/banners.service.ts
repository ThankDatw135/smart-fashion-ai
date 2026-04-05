import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { BannerPosition as PrismaBannerPosition } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../infrastructure/redis/redis.service.js';
import {
  CreateBannerDto,
  UpdateBannerDto,
  BannerPosition,
} from './dto/index.js';

// Ghi chú: Cache key cho banner public
const BANNER_CACHE_KEY = 'banners:active';
const BANNER_CACHE_TTL = 600; // 10 phút

/**
 * Banner Service — Quản lý banner trang chủ
 * - Admin CRUD
 * - Public: lấy banner active (cache 10 phút)
 * - Upload ảnh banner (WebP, resize)
 *
 * Lưu ý: Schema dùng imageUrl required, không có subtitle
 */
@Injectable()
export class BannersService {
  private readonly logger = new Logger(BannersService.name);
  private readonly uploadDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    this.uploadDir = path.resolve(process.cwd(), '..', 'uploads', 'banners');
    this.ensureDir(this.uploadDir);
  }

  // ===========================================================================
  // ADMIN — CRUD BANNER
  // ===========================================================================

  /**
   * Tạo banner mới (Admin) — bắt buộc có ảnh
   */
  async create(dto: CreateBannerDto, image?: Express.Multer.File) {
    if (!image) {
      throw new BadRequestException('Bắt buộc upload ảnh banner');
    }

    const imageUrl = await this.uploadImage(image);

    const banner = await this.prisma.banner.create({
      data: {
        title: dto.title,
        imageUrl,
        linkUrl: dto.linkUrl ?? null,
        position: dto.position as PrismaBannerPosition,
        sortOrder: dto.sortOrder ?? 0,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isActive: true,
      },
    });

    await this.invalidateCache();

    this.logger.log(`Banner tạo mới: "${banner.title}" [${banner.position}]`);
    return banner;
  }

  /**
   * Danh sách banner (Admin — filter position, active)
   */
  async findAllAdmin(params: {
    position?: BannerPosition;
    isActive?: boolean;
  }) {
    const { position, isActive } = params;

    const where: Record<string, unknown> = {};
    if (position) where.position = position;
    if (isActive !== undefined) where.isActive = isActive;

    return this.prisma.banner.findMany({
      where,
      orderBy: [
        { position: 'asc' },
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Cập nhật banner (Admin)
   */
  async update(id: string, dto: UpdateBannerDto, image?: Express.Multer.File) {
    const banner = await this.prisma.banner.findUnique({
      where: { id },
    });
    if (!banner) {
      throw new NotFoundException('Banner không tồn tại');
    }

    const imageUrl = image ? await this.uploadImage(image) : undefined;

    const updated = await this.prisma.banner.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.linkUrl !== undefined && {
          linkUrl: dto.linkUrl,
        }),
        ...(dto.position && {
          position: dto.position as PrismaBannerPosition,
        }),
        ...(dto.sortOrder !== undefined && {
          sortOrder: dto.sortOrder,
        }),
        ...(dto.startDate !== undefined && {
          startDate: dto.startDate ? new Date(dto.startDate) : null,
        }),
        ...(dto.endDate !== undefined && {
          endDate: dto.endDate ? new Date(dto.endDate) : null,
        }),
        ...(dto.isActive !== undefined && {
          isActive: dto.isActive,
        }),
        ...(imageUrl && { imageUrl }),
      },
    });

    await this.invalidateCache();

    this.logger.log(`Banner updated: "${updated.title}"`);
    return updated;
  }

  /**
   * Xóa banner (Admin)
   */
  async delete(id: string) {
    const banner = await this.prisma.banner.findUnique({
      where: { id },
    });
    if (!banner) {
      throw new NotFoundException('Banner không tồn tại');
    }

    await this.prisma.banner.delete({ where: { id } });
    await this.invalidateCache();

    return { message: 'Đã xóa banner' };
  }

  // ===========================================================================
  // PUBLIC — ACTIVE BANNERS
  // ===========================================================================

  /**
   * Lấy banner đang active (cache 10 phút)
   * Filter: isActive = true + trong khoảng thời gian hiển thị
   */
  async findActivePublic(position?: BannerPosition) {
    // Thử cache trước
    const cacheKey = position
      ? `${BANNER_CACHE_KEY}:${position}`
      : BANNER_CACHE_KEY;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const now = new Date();

    const banners = await this.prisma.banner.findMany({
      where: {
        isActive: true,
        ...(position && {
          position: position as PrismaBannerPosition,
        }),
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [
          {
            OR: [{ endDate: null }, { endDate: { gte: now } }],
          },
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        imageUrl: true,
        linkUrl: true,
        position: true,
      },
    });

    // Lưu cache 10 phút
    await this.redis.set(cacheKey, JSON.stringify(banners), BANNER_CACHE_TTL);

    return banners;
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  /**
   * Upload + resize banner image (WebP, 1200x400)
   */
  private async uploadImage(file: Express.Multer.File): Promise<string> {
    const hash = crypto.randomBytes(8).toString('hex');
    const filename = `${Date.now()}-${hash}.webp`;
    const filepath = path.join(this.uploadDir, filename);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await (sharp as any)(file.buffer)
      .resize(1200, 400, { fit: 'cover' })
      .webp({ quality: 90 })
      .toFile(filepath);

    return `/uploads/banners/${filename}`;
  }

  /**
   * Invalidate all banner cache keys
   */
  private async invalidateCache(): Promise<void> {
    const positions = Object.values(BannerPosition);
    const keys = [
      BANNER_CACHE_KEY,
      ...positions.map((p) => `${BANNER_CACHE_KEY}:${p}`),
    ];

    for (const key of keys) {
      await this.redis.del(key);
    }
  }

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
