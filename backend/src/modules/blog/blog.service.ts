import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../infrastructure/redis/redis.service.js';
import {
  CreateBlogPostDto,
  UpdateBlogPostDto,
  CreateBlogCategoryDto,
  UpdateBlogCategoryDto,
} from './dto/index.js';

// Ghi chú: Cache key prefix
const BLOG_CACHE_PREFIX = 'blog';

/**
 * Blog Service — Hệ thống blog
 * - Admin: CRUD bài viết + danh mục
 * - Public: listing + detail (tăng viewCount)
 * - Upload thumbnail (WebP 800x450)
 * - Vietnamese-friendly slug generation
 *
 * Lưu ý: Schema Prisma dùng model "Blog" (isPublished boolean)
 * thay vì "BlogPost" (status string). Service adapt cho cả 2.
 */
@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name);
  private readonly uploadDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    this.uploadDir = path.resolve(
      process.cwd(),
      '..',
      'uploads',
      'blog',
    );
    this.ensureDir(this.uploadDir);
  }

  // ===========================================================================
  // ADMIN — BÀI VIẾT
  // ===========================================================================

  /**
   * Tạo bài viết mới (Admin)
   */
  async createPost(
    dto: CreateBlogPostDto,
    authorId: string,
    thumbnail?: Express.Multer.File,
  ) {
    const slug = dto.slug || this.generateSlug(dto.title);

    // Check slug unique
    const existing = await this.prisma.blog.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new ConflictException(`Slug "${slug}" đã tồn tại`);
    }

    // Upload thumbnail nếu có
    const thumbnailUrl = thumbnail
      ? await this.uploadThumbnail(thumbnail)
      : null;

    const isPublished = dto.status === 'published';

    const post = await this.prisma.blog.create({
      data: {
        title: dto.title,
        slug,
        content: dto.content,
        excerpt: dto.excerpt ?? null,
        thumbnailUrl,
        isPublished,
        authorId,
        categoryId: dto.categoryId,
        ...(isPublished && { publishedAt: new Date() }),
      },
      include: {
        author: {
          select: { id: true, fullName: true },
        },
        category: {
          select: { id: true, name: true },
        },
      },
    });

    this.logger.log(
      `Blog tạo mới: "${post.title}" [${isPublished ? 'published' : 'draft'}]`,
    );
    return post;
  }

  /**
   * Danh sách bài viết (Admin — filter draft/published)
   */
  async findAllAdmin(params: {
    cursor?: string;
    limit?: number;
    status?: 'draft' | 'published';
    categoryId?: string;
  }) {
    const { cursor, limit = 20, status, categoryId } = params;

    const where: Prisma.BlogWhereInput = {};
    if (status === 'published') where.isPublished = true;
    if (status === 'draft') where.isPublished = false;
    if (categoryId) where.categoryId = categoryId;

    const posts = await this.prisma.blog.findMany({
      where,
      take: limit + 1,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, fullName: true },
        },
        category: {
          select: { id: true, name: true },
        },
      },
    });

    const hasNext = posts.length > limit;
    const items = hasNext ? posts.slice(0, limit) : posts;
    const nextCursor = hasNext ? items[items.length - 1]?.id : null;

    return {
      items,
      pagination: {
        hasNext,
        nextCursor,
        total: await this.prisma.blog.count({ where }),
      },
    };
  }

  /**
   * Chi tiết bài viết (Admin — để edit)
   */
  async findOneAdmin(id: string) {
    const post = await this.prisma.blog.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, fullName: true },
        },
        category: {
          select: { id: true, name: true },
        },
      },
    });

    if (!post) throw new NotFoundException('Bài viết không tồn tại');
    return post;
  }

  /**
   * Cập nhật bài viết (Admin)
   */
  async updatePost(
    id: string,
    dto: UpdateBlogPostDto,
    thumbnail?: Express.Multer.File,
  ) {
    const existing = await this.findOneAdmin(id);

    const thumbnailUrl = thumbnail
      ? await this.uploadThumbnail(thumbnail)
      : undefined;

    const post = await this.prisma.blog.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.content && { content: dto.content }),
        ...(dto.excerpt !== undefined && { excerpt: dto.excerpt }),
        ...(dto.categoryId !== undefined && {
          categoryId: dto.categoryId,
        }),
        ...(dto.status && {
          isPublished: dto.status === 'published',
          ...(dto.status === 'published' && {
            publishedAt: new Date(),
          }),
        }),
        ...(thumbnailUrl && { thumbnailUrl }),
      },
      include: {
        author: {
          select: { id: true, fullName: true },
        },
        category: {
          select: { id: true, name: true },
        },
      },
    });

    // Invalidate cache
    await this.redis.del(`${BLOG_CACHE_PREFIX}:list`);
    await this.redis.del(
      `${BLOG_CACHE_PREFIX}:post:${existing.slug}`,
    );

    this.logger.log(`Blog updated: "${post.title}"`);
    return post;
  }

  /**
   * Xóa bài viết (Admin)
   */
  async deletePost(id: string) {
    await this.findOneAdmin(id);
    await this.prisma.blog.delete({ where: { id } });
    await this.redis.del(`${BLOG_CACHE_PREFIX}:list`);
    return { message: 'Đã xóa bài viết' };
  }

  // ===========================================================================
  // ADMIN — DANH MỤC BLOG
  // ===========================================================================

  async createCategory(dto: CreateBlogCategoryDto) {
    const slug = dto.slug || this.generateSlug(dto.name);

    const existing = await this.prisma.blogCategory.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new ConflictException(
        `Danh mục blog "${dto.name}" đã tồn tại`,
      );
    }

    return this.prisma.blogCategory.create({
      data: {
        name: dto.name,
        slug,
      },
    });
  }

  async findAllCategories() {
    return this.prisma.blogCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { blogs: true } },
      },
    });
  }

  async updateCategory(id: string, dto: UpdateBlogCategoryDto) {
    const category = await this.prisma.blogCategory.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Danh mục blog không tồn tại');
    }

    return this.prisma.blogCategory.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
      },
    });
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.blogCategory.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Danh mục blog không tồn tại');
    }

    await this.prisma.blogCategory.delete({ where: { id } });
    return { message: 'Đã xóa danh mục blog' };
  }

  // ===========================================================================
  // PUBLIC — BLOG LISTING
  // ===========================================================================

  /**
   * Danh sách bài viết public (chỉ published)
   */
  async findAllPublic(params: {
    cursor?: string;
    limit?: number;
    categorySlug?: string;
  }) {
    const { cursor, limit = 12, categorySlug } = params;

    const where: Prisma.BlogWhereInput = {
      isPublished: true,
    };

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    const posts = await this.prisma.blog.findMany({
      where,
      take: limit + 1,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        thumbnailUrl: true,
        publishedAt: true,
        viewCount: true,
        author: {
          select: { fullName: true },
        },
        category: {
          select: { name: true, slug: true },
        },
      },
    });

    const hasNext = posts.length > limit;
    const items = hasNext ? posts.slice(0, limit) : posts;
    const nextCursor = hasNext ? items[items.length - 1]?.id : null;

    return {
      items,
      pagination: { hasNext, nextCursor },
    };
  }

  /**
   * Chi tiết bài viết public (by slug, tăng viewCount)
   */
  async findBySlug(slug: string) {
    const post = await this.prisma.blog.findUnique({
      where: { slug },
      include: {
        author: {
          select: { fullName: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!post || !post.isPublished) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    // Tăng viewCount (fire-and-forget)
    this.prisma.blog
      .update({
        where: { id: post.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {
        /* ignore */
      });

    // Related posts cùng danh mục
    const related = post.categoryId
      ? await this.prisma.blog.findMany({
          where: {
            categoryId: post.categoryId,
            id: { not: post.id },
            isPublished: true,
          },
          take: 4,
          orderBy: { publishedAt: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnailUrl: true,
            publishedAt: true,
          },
        })
      : [];

    return { ...post, related };
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  /**
   * Tạo slug từ title (Vietnamese-friendly)
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-z0-9\s-]/g, '') // Bỏ ký tự đặc biệt
      .replace(/\s+/g, '-') // Space → dash
      .replace(/-+/g, '-') // Gộp dash
      .replace(/^-+|-+$/g, '') // Trim dash
      .concat(`-${Date.now().toString(36)}`); // Unique suffix
  }

  /**
   * Upload + resize thumbnail (WebP, 800x450)
   */
  private async uploadThumbnail(
    file: Express.Multer.File,
  ): Promise<string> {
    const hash = crypto.randomBytes(8).toString('hex');
    const filename = `${Date.now()}-${hash}.webp`;
    const filepath = path.join(this.uploadDir, filename);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await (sharp as any)(file.buffer)
      .resize(800, 450, { fit: 'cover' })
      .webp({ quality: 85 })
      .toFile(filepath);

    return `/uploads/blog/${filename}`;
  }

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
