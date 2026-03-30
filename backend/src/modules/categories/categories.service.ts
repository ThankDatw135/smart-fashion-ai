import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../infrastructure/redis/redis.service.js';
import { CACHE_KEYS } from '../../common/constants/cache-keys.js';
import {
  CATEGORY_NOT_FOUND,
  CATEGORY_HAS_PRODUCTS,
  CATEGORY_SLUG_EXISTS,
} from '../../common/constants/error-codes.js';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/index.js';
import { generateSlug } from '../../common/utils/slug.js';

// Ghi chú: Interface cho node trong cây danh mục
export interface CategoryTreeNode {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  children: CategoryTreeNode[];
}

/**
 * Categories Service — CRUD danh mục + cây nested + cache Redis
 */
@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ===========================================================================
  // TRUY VẤN CÂY DANH MỤC (Public)
  // ===========================================================================

  /**
   * Lấy cây danh mục dạng nested — cache Redis TTL 1 giờ
   * Build recursive: flat list → tree structure
   */
  async getCategoryTree(): Promise<CategoryTreeNode[]> {
    // 1. Kiểm tra cache
    const cached = await this.redis.getJson<CategoryTreeNode[]>(
      CACHE_KEYS.CATEGORY_TREE,
    );
    if (cached) {
      this.logger.debug('Cache hit: categories:tree');
      return cached;
    }

    // 2. Query tất cả danh mục active, sắp xếp theo sortOrder
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        nameEn: true,
        slug: true,
        parentId: true,
        imageUrl: true,
        sortOrder: true,
      },
    });

    // 3. Build tree structure từ flat list
    const tree = this.buildTree(categories);

    // 4. Cache kết quả — TTL 1 giờ (3600 giây)
    await this.redis.setJson(CACHE_KEYS.CATEGORY_TREE, tree, 3600);
    this.logger.debug('Cache set: categories:tree (TTL 1h)');

    return tree;
  }

  /**
   * Lấy chi tiết 1 danh mục theo ID
   */
  async findById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { children: true, parent: true },
    });

    if (!category) {
      throw new NotFoundException(CATEGORY_NOT_FOUND);
    }

    return category;
  }

  // ===========================================================================
  // ADMIN CRUD
  // ===========================================================================

  /**
   * Admin tạo danh mục mới
   * - Tự generate slug từ name (Vietnamese-safe)
   * - Kiểm tra slug unique
   * - Invalidate cache
   */
  async create(dto: CreateCategoryDto) {
    // 1. Generate slug
    let slug = generateSlug(dto.name);

    // 2. Kiểm tra slug unique — nếu trùng thì thêm suffix
    const existingSlug = await this.prisma.category.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      // Thử thêm suffix số từ 1 → 10
      let found = false;
      for (let i = 1; i <= 10; i++) {
        const candidate = `${slug}-${i}`;
        const exists = await this.prisma.category.findUnique({
          where: { slug: candidate },
        });
        if (!exists) {
          slug = candidate;
          found = true;
          break;
        }
      }
      if (!found) {
        throw new ConflictException(CATEGORY_SLUG_EXISTS);
      }
    }

    // 3. Nếu có parentId, kiểm tra parent tồn tại
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(CATEGORY_NOT_FOUND);
      }
    }

    // 4. Tạo danh mục
    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        nameEn: dto.nameEn,
        slug,
        parentId: dto.parentId || null,
        imageUrl: dto.imageUrl,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    // 5. Invalidate cache cây danh mục
    await this.invalidateCache();

    this.logger.log(`Danh mục đã tạo: ${category.name} (${category.slug})`);
    return category;
  }

  /**
   * Admin cập nhật danh mục
   */
  async update(id: string, dto: UpdateCategoryDto) {
    // 1. Kiểm tra tồn tại
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(CATEGORY_NOT_FOUND);
    }

    // 2. Nếu đổi tên → gen slug mới
    const updateData: Record<string, unknown> = { ...dto };
    if (dto.name && dto.name !== existing.name) {
      let newSlug = generateSlug(dto.name);
      const slugExists = await this.prisma.category.findFirst({
        where: { slug: newSlug, id: { not: id } },
      });
      if (slugExists) {
        newSlug = `${newSlug}-${Date.now().toString(36).slice(-4)}`;
      }
      updateData.slug = newSlug;
    }

    // 3. Không cho phép parentId = chính mình
    if (dto.parentId && dto.parentId === id) {
      throw new BadRequestException('Danh mục không thể là cha của chính nó');
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: updateData as Record<string, unknown> & { slug?: string },
    });

    // 4. Invalidate cache
    await this.invalidateCache();

    this.logger.log(`Danh mục đã cập nhật: ${category.name}`);
    return category;
  }

  /**
   * Admin xóa danh mục
   * - Không cho xóa nếu còn sản phẩm gắn với danh mục
   * - Không cho xóa nếu còn danh mục con
   */
  async remove(id: string) {
    // 1. Kiểm tra tồn tại
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true, children: true } },
      },
    });

    if (!category) {
      throw new NotFoundException(CATEGORY_NOT_FOUND);
    }

    // 2. Kiểm tra ràng buộc
    if (category._count.products > 0) {
      throw new BadRequestException(CATEGORY_HAS_PRODUCTS);
    }

    if (category._count.children > 0) {
      throw new BadRequestException(
        'Không thể xóa danh mục có danh mục con. Hãy xóa danh mục con trước.',
      );
    }

    // 3. Xóa
    await this.prisma.category.delete({ where: { id } });

    // 4. Invalidate cache
    await this.invalidateCache();

    this.logger.log(`Danh mục đã xóa: ${category.name}`);
    return { message: `Đã xóa danh mục: ${category.name}` };
  }

  // ===========================================================================
  // HELPER
  // ===========================================================================

  /**
   * Build cây danh mục từ flat list
   * Nhóm theo parentId → recursive build
   */
  private buildTree(
    categories: Array<{
      id: string;
      name: string;
      nameEn: string | null;
      slug: string;
      parentId: string | null;
      imageUrl: string | null;
      sortOrder: number;
    }>,
  ): CategoryTreeNode[] {
    // Tạo map: parentId → children
    const childrenMap = new Map<string | null, typeof categories>();
    for (const cat of categories) {
      const key = cat.parentId;
      if (!childrenMap.has(key)) {
        childrenMap.set(key, []);
      }
      childrenMap.get(key)!.push(cat);
    }

    // Build recursive từ root (parentId = null)
    const buildNodes = (parentId: string | null): CategoryTreeNode[] => {
      const children = childrenMap.get(parentId) || [];
      return children.map((cat) => ({
        id: cat.id,
        name: cat.name,
        nameEn: cat.nameEn,
        slug: cat.slug,
        imageUrl: cat.imageUrl,
        sortOrder: cat.sortOrder,
        children: buildNodes(cat.id),
      }));
    };

    return buildNodes(null);
  }

  /**
   * Invalidate cache cây danh mục
   */
  private async invalidateCache() {
    await this.redis.del(CACHE_KEYS.CATEGORY_TREE);
    this.logger.debug('Cache invalidated: categories:tree');
  }
}
