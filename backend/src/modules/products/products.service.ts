import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../infrastructure/redis/redis.service.js';
import { RabbitmqService } from '../../infrastructure/rabbitmq/rabbitmq.service.js';
import { CACHE_KEYS } from '../../common/constants/cache-keys.js';
import {
  PRODUCT_NOT_FOUND,
  CATEGORY_NOT_FOUND,
  PRODUCT_OUT_OF_STOCK,
} from '../../common/constants/error-codes.js';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductFilterDto,
  ProductSortEnum,
} from './dto/index.js';
import { generateSlug } from '../../common/utils/slug.js';
import {
  decodeCursor,
  buildPaginationResponse,
} from '../../common/utils/pagination.js';
import * as crypto from 'crypto';

/**
 * Products Service — CRUD sản phẩm, filter, pagination, cache, events
 */
@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly rabbitmq: RabbitmqService,
  ) {}

  // ===========================================================================
  // ADMIN — TẠO SẢN PHẨM
  // ===========================================================================

  /**
   * Tạo sản phẩm mới — Transaction gồm:
   * 1. Validate categoryId tồn tại
   * 2. Generate slug (Vietnamese-safe, unique)
   * 3. Generate SKU cho mỗi variant
   * 4. INSERT product → variants → tag_map
   * 5. Publish event product.created → RabbitMQ
   */
  async create(dto: CreateProductDto, imageUrls: string[] = []) {
    // 1. Kiểm tra category
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(CATEGORY_NOT_FOUND);
    }

    // 2. Generate slug unique
    const slug = await this.generateUniqueSlug(dto.name);

    // 3. Transaction: tạo product + variants + images + tags
    const product = await this.prisma.$transaction(async (tx) => {
      // 3a. Tạo product
      const created = await tx.product.create({
        data: {
          name: dto.name,
          nameEn: dto.nameEn,
          slug,
          description: dto.description,
          descriptionEn: dto.descriptionEn,
          price: dto.price,
          salePrice: dto.salePrice,
          categoryId: dto.categoryId,
          material: dto.material,
          brand: dto.brand,
          sizeChart: dto.sizeChart
            ? (dto.sizeChart as Prisma.InputJsonValue)
            : undefined,
          isFeatured: dto.isFeatured ?? false,
        },
      });

      // 3b. Tạo variants + tự sinh SKU
      const slugPrefix = slug.slice(0, 10).toUpperCase().replace(/-/g, '');
      for (const variant of dto.variants) {
        const sizeCode = variant.size.toUpperCase();
        const colorCode = variant.color.slice(0, 3).toUpperCase();
        const sku = `${slugPrefix}-${sizeCode}-${colorCode}-${crypto.randomBytes(2).toString('hex')}`;

        await tx.productVariant.create({
          data: {
            productId: created.id,
            size: variant.size,
            color: variant.color,
            colorCode: variant.colorCode,
            stockQuantity: variant.stockQuantity,
            sku,
          },
        });
      }

      // 3c. Tạo images (nếu có)
      if (imageUrls.length > 0) {
        await tx.productImage.createMany({
          data: imageUrls.map((url, index) => ({
            productId: created.id,
            imageUrl: url,
            sortOrder: index,
            isPrimary: index === 0, // Ảnh đầu tiên là primary
          })),
        });
      }

      // 3d. Gắn tags (nếu có)
      if (dto.tagIds && dto.tagIds.length > 0) {
        await tx.productTagMap.createMany({
          data: dto.tagIds.map((tagId) => ({
            productId: created.id,
            tagId,
          })),
        });
      }

      return created;
    });

    // 4. Load lại product đầy đủ để trả về
    const fullProduct = await this.findByIdFull(product.id);

    // 5. Publish event → RabbitMQ (AI Service sẽ re-index embedding)
    await this.rabbitmq.publish('product.events', 'product.created', {
      productId: product.id,
      name: dto.name,
      description: dto.description,
      categoryId: dto.categoryId,
    });

    this.logger.log(`Sản phẩm đã tạo: ${dto.name} (${slug})`);
    return fullProduct;
  }

  // ===========================================================================
  // ADMIN — CẬP NHẬT SẢN PHẨM
  // ===========================================================================

  /**
   * Cập nhật sản phẩm (partial update)
   * - Nếu đổi tên → gen slug mới
   * - Nếu đổi tagIds → xóa cũ, gắn mới
   * - Invalidate cache + publish event
   */
  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(PRODUCT_NOT_FOUND);
    }

    // Kiểm tra category nếu đổi
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) throw new NotFoundException(CATEGORY_NOT_FOUND);
    }

    // Build update data
    const updateData: Prisma.ProductUpdateInput = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.nameEn !== undefined) updateData.nameEn = dto.nameEn;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.descriptionEn !== undefined)
      updateData.descriptionEn = dto.descriptionEn;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.salePrice !== undefined) updateData.salePrice = dto.salePrice;
    if (dto.material !== undefined) updateData.material = dto.material;
    if (dto.brand !== undefined) updateData.brand = dto.brand;
    if (dto.sizeChart !== undefined) {
      updateData.sizeChart = dto.sizeChart as Prisma.InputJsonValue;
    }
    if (dto.isFeatured !== undefined) updateData.isFeatured = dto.isFeatured;
    if (dto.categoryId !== undefined) {
      updateData.category = { connect: { id: dto.categoryId } };
    }

    // Nếu đổi tên → gen slug mới
    if (dto.name && dto.name !== existing.name) {
      updateData.slug = await this.generateUniqueSlug(dto.name, id);
    }

    // Transaction: update product + tags
    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: updateData,
      });

      // Nếu đổi tags → xóa cũ, gắn mới
      if (dto.tagIds) {
        await tx.productTagMap.deleteMany({ where: { productId: id } });
        if (dto.tagIds.length > 0) {
          await tx.productTagMap.createMany({
            data: dto.tagIds.map((tagId) => ({ productId: id, tagId })),
          });
        }
      }
    });

    // Invalidate cache
    await this.invalidateProductCache(existing.slug);

    // Publish event
    await this.rabbitmq.publish('product.events', 'product.updated', {
      productId: id,
      name: dto.name || existing.name,
    });

    const updated = await this.findByIdFull(id);
    this.logger.log(`Sản phẩm đã cập nhật: ${updated?.name}`);
    return updated;
  }

  // ===========================================================================
  // ADMIN — SOFT DELETE
  // ===========================================================================

  /**
   * Soft delete — set isActive = false
   */
  async softDelete(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(PRODUCT_NOT_FOUND);

    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    await this.invalidateProductCache(product.slug);
    this.logger.log(`Sản phẩm đã ẩn: ${product.name}`);

    return { message: `Đã ẩn sản phẩm: ${product.name}` };
  }

  // ===========================================================================
  // PUBLIC — DANH SÁCH SẢN PHẨM (Filter + Cursor Pagination)
  // ===========================================================================

  /**
   * Lấy danh sách sản phẩm với filters + cursor-based pagination
   * Cache Redis TTL 5 phút, key = hash(filter params)
   */
  async findAll(filter: ProductFilterDto) {
    const limit = filter.limit || 20;

    // 1. Kiểm tra cache (key = hash của toàn bộ filter)
    const cacheKey = CACHE_KEYS.PRODUCT_LIST(this.hashFilter(filter));
    const cached = await this.redis.getJson<unknown>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return cached;
    }

    // 2. Build WHERE clause
    const where: Prisma.ProductWhereInput = { isActive: true };

    // Filter: category slug
    if (filter.category) {
      where.category = { slug: filter.category };
    }

    // Filter: price range
    if (filter.minPrice || filter.maxPrice) {
      where.price = {};
      if (filter.minPrice) where.price.gte = filter.minPrice;
      if (filter.maxPrice) where.price.lte = filter.maxPrice;
    }

    // Filter: sizes (variant phải có size trong danh sách VÀ còn stock)
    if (filter.sizes) {
      const sizeList = filter.sizes.split(',').map((s) => s.trim());
      where.variants = {
        some: {
          size: { in: sizeList },
          stockQuantity: { gt: 0 },
          isActive: true,
        },
      };
    }

    // Filter: colors
    if (filter.colors) {
      const colorList = filter.colors.split(',').map((s) => s.trim());
      where.variants = {
        some: {
          color: { in: colorList },
          stockQuantity: { gt: 0 },
          isActive: true,
          // Ghi chú: nếu đã filter sizes trước đó, Prisma sẽ AND thêm điều kiện color
          ...(filter.sizes
            ? { size: { in: filter.sizes.split(',').map((s) => s.trim()) } }
            : {}),
        },
      };
    }

    // Filter: search keyword
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { nameEn: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    // Filter: tags
    if (filter.tags) {
      const tagList = filter.tags.split(',').map((t) => t.trim());
      where.tags = {
        some: {
          tag: { name: { in: tagList } },
        },
      };
    }

    // 3. Build ORDER BY
    const orderBy = this.buildOrderBy(filter.sort || ProductSortEnum.NEWEST);

    // 4. Build cursor
    const cursorOption: Prisma.ProductFindManyArgs = {};
    if (filter.cursor) {
      cursorOption.cursor = { id: decodeCursor(filter.cursor) };
      cursorOption.skip = 1; // Bỏ qua record tại cursor
    }

    // 5. Query (lấy limit + 1 để check hasMore)
    const products = await this.prisma.product.findMany({
      where,
      orderBy,
      take: limit + 1,
      ...cursorOption,
      select: {
        id: true,
        name: true,
        nameEn: true,
        slug: true,
        price: true,
        salePrice: true,
        avgRating: true,
        reviewCount: true,
        soldCount: true,
        isFeatured: true,
        createdAt: true,
        images: {
          where: { isPrimary: true },
          select: { imageUrl: true, altText: true },
          take: 1,
        },
        tags: {
          select: { tag: { select: { id: true, name: true, color: true } } },
        },
        variants: {
          where: { isActive: true },
          select: { stockQuantity: true },
        },
      },
    });

    // 6. Build response với pagination
    const result = buildPaginationResponse(products, limit);

    // 7. Bổ sung tổng stock + isInStock cho mỗi sản phẩm
    const enrichedData = result.data.map((p) => {
      const totalStock = p.variants.reduce(
        (sum, v) => sum + v.stockQuantity,
        0,
      );
      return {
        ...p,
        primaryImage: p.images[0]?.imageUrl || null,
        isInStock: totalStock > 0,
        totalStock,
        tags: p.tags.map((t) => t.tag),
      };
    });

    const response = { data: enrichedData, meta: result.meta };

    // 8. Cache kết quả (TTL 5 phút = 300 giây)
    await this.redis.setJson(cacheKey, response, 300);

    return response;
  }

  // ===========================================================================
  // PUBLIC — CHI TIẾT SẢN PHẨM
  // ===========================================================================

  /**
   * Lấy chi tiết sản phẩm theo slug
   * Cache Redis TTL 5 phút
   */
  async findBySlug(slug: string) {
    // 1. Check cache
    const cacheKey = CACHE_KEYS.PRODUCT_DETAIL(slug);
    const cached = await this.redis.getJson<unknown>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: product:${slug}`);
      return cached;
    }

    // 2. Query DB
    const product = await this.prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        category: {
          select: { id: true, name: true, nameEn: true, slug: true },
        },
        variants: {
          where: { isActive: true },
          orderBy: [{ size: 'asc' }, { color: 'asc' }],
        },
        images: { orderBy: { sortOrder: 'asc' } },
        tags: {
          select: { tag: { select: { id: true, name: true, color: true } } },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!product) throw new NotFoundException(PRODUCT_NOT_FOUND);

    // 3. Enrich data
    const totalStock = product.variants.reduce(
      (s, v) => s + v.stockQuantity,
      0,
    );
    const response = {
      ...product,
      tags: product.tags.map((t) => t.tag),
      isInStock: totalStock > 0,
      totalStock,
    };

    // 4. Cache (TTL 5 phút)
    await this.redis.setJson(cacheKey, response, 300);

    return response;
  }

  // ===========================================================================
  // PUBLIC — SẢN PHẨM LIÊN QUAN
  // ===========================================================================

  /**
   * Sản phẩm liên quan — cùng category, loại bỏ sản phẩm hiện tại
   */
  async findRelated(slug: string, limit = 8) {
    const cacheKey = CACHE_KEYS.PRODUCT_RELATED(slug);
    const cached = await this.redis.getJson<unknown>(cacheKey);
    if (cached) return cached;

    const product = await this.prisma.product.findUnique({
      where: { slug },
      select: { id: true, categoryId: true },
    });

    if (!product) throw new NotFoundException(PRODUCT_NOT_FOUND);

    const related = await this.prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        isActive: true,
        id: { not: product.id },
      },
      take: limit,
      orderBy: { soldCount: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        salePrice: true,
        avgRating: true,
        images: {
          where: { isPrimary: true },
          select: { imageUrl: true },
          take: 1,
        },
      },
    });

    const result = related.map((p) => ({
      ...p,
      primaryImage: p.images[0]?.imageUrl || null,
    }));

    await this.redis.setJson(cacheKey, result, 300);
    return result;
  }

  // ===========================================================================
  // ADMIN — QUẢN LÝ VARIANTS
  // ===========================================================================

  /**
   * Thêm variant mới cho sản phẩm
   */
  async addVariant(
    productId: string,
    data: {
      size: string;
      color: string;
      colorCode?: string;
      stockQuantity: number;
    },
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException(PRODUCT_NOT_FOUND);

    const slugPrefix = product.slug
      .slice(0, 10)
      .toUpperCase()
      .replace(/-/g, '');
    const sku = `${slugPrefix}-${data.size.toUpperCase()}-${data.color.slice(0, 3).toUpperCase()}-${crypto.randomBytes(2).toString('hex')}`;

    const variant = await this.prisma.productVariant.create({
      data: {
        productId,
        size: data.size,
        color: data.color,
        colorCode: data.colorCode,
        stockQuantity: data.stockQuantity,
        sku,
      },
    });

    await this.invalidateProductCache(product.slug);
    return variant;
  }

  /**
   * Cập nhật variant (stock, color, size)
   */
  async updateVariant(
    variantId: string,
    data: Partial<{
      size: string;
      color: string;
      colorCode: string;
      stockQuantity: number;
      isActive: boolean;
    }>,
  ) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { select: { slug: true } } },
    });

    if (!variant) throw new NotFoundException('PRODUCT_VARIANT_NOT_FOUND');

    const updated = await this.prisma.productVariant.update({
      where: { id: variantId },
      data,
    });

    // Nếu stock từ 0 → có hàng lại → có thể trigger notification (Phase 5)
    if (
      variant.stockQuantity === 0 &&
      data.stockQuantity &&
      data.stockQuantity > 0
    ) {
      this.logger.log(`Sản phẩm có hàng lại: variant ${variantId}`);
    }

    await this.invalidateProductCache(variant.product.slug);
    return updated;
  }

  /**
   * Trừ stock — Optimistic Locking
   * Dùng raw query: UPDATE WHERE stock >= qty
   * Trả về rowsAffected = 0 nếu hết hàng → throw
   */
  async deductStock(variantId: string, quantity: number): Promise<void> {
    const result = await this.prisma.$executeRaw`
      UPDATE product_variants 
      SET stock_quantity = stock_quantity - ${quantity}
      WHERE id = ${variantId}::uuid AND stock_quantity >= ${quantity}
    `;

    if (result === 0) {
      throw new BadRequestException(PRODUCT_OUT_OF_STOCK);
    }
  }

  // ===========================================================================
  // HELPER
  // ===========================================================================

  /**
   * Load product đầy đủ quan hệ (dùng nội bộ)
   */
  private async findByIdFull(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: { where: { isActive: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        tags: { select: { tag: true } },
      },
    });
  }

  /**
   * Generate slug unique — kiểm tra DB, thử suffix 1-10
   */
  private async generateUniqueSlug(
    name: string,
    excludeId?: string,
  ): Promise<string> {
    const slug = generateSlug(name);

    const whereClause: Prisma.ProductWhereInput = { slug };
    if (excludeId) whereClause.id = { not: excludeId };

    const existing = await this.prisma.product.findFirst({
      where: whereClause,
    });
    if (!existing) return slug;

    for (let i = 1; i <= 10; i++) {
      const candidate = `${slug}-${i}`;
      const exists = await this.prisma.product.findFirst({
        where: {
          slug: candidate,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      });
      if (!exists) return candidate;
    }

    // Fallback: thêm random suffix
    return `${slug}-${crypto.randomBytes(3).toString('hex')}`;
  }

  /**
   * Build ORDER BY từ sort enum
   */
  private buildOrderBy(
    sort: ProductSortEnum,
  ): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case ProductSortEnum.NEWEST:
        return { createdAt: 'desc' };
      case ProductSortEnum.BEST_SELLER:
        return { soldCount: 'desc' };
      case ProductSortEnum.PRICE_ASC:
        return { price: 'asc' };
      case ProductSortEnum.PRICE_DESC:
        return { price: 'desc' };
      case ProductSortEnum.RATING:
        return { avgRating: 'desc' };
      default:
        return { createdAt: 'desc' };
    }
  }

  /**
   * Hash filter params → dùng làm cache key
   */
  private hashFilter(filter: ProductFilterDto): string {
    const str = JSON.stringify(filter);
    return crypto.createHash('md5').update(str).digest('hex').slice(0, 12);
  }

  /**
   * Invalidate tất cả cache liên quan đến product
   */
  private async invalidateProductCache(slug: string) {
    await Promise.all([
      this.redis.del(CACHE_KEYS.PRODUCT_DETAIL(slug)),
      this.redis.del(CACHE_KEYS.PRODUCT_RELATED(slug)),
      this.redis.delByPattern('products:list:*'),
    ]);
    this.logger.debug(`Cache invalidated: product:${slug}`);
  }
}
