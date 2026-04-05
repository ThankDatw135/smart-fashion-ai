import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

/**
 * Wishlist Service — Danh sách yêu thích
 * - Toggle thêm/xóa sản phẩm
 * - Danh sách wishlist (cursor pagination)
 * - Kiểm tra sản phẩm đã yêu thích chưa
 */
@Injectable()
export class WishlistService {
  private readonly logger = new Logger(WishlistService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Toggle yêu thích — thêm nếu chưa có, xóa nếu đã có
   */
  async toggle(userId: string, productId: string) {
    // Check sản phẩm tồn tại
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true },
    });
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    // Check đã yêu thích chưa
    const existing = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (existing) {
      // Đã có → xóa
      await this.prisma.wishlist.delete({
        where: { id: existing.id },
      });
      this.logger.debug(`Wishlist: Bỏ yêu thích "${product.name}"`);
      return { action: 'removed', productId };
    }

    // Chưa có → thêm
    await this.prisma.wishlist.create({
      data: { userId, productId },
    });
    this.logger.debug(`Wishlist: Thêm yêu thích "${product.name}"`);
    return { action: 'added', productId };
  }

  /**
   * Danh sách yêu thích (cursor pagination + product info)
   */
  async findAll(userId: string, cursor?: string, limit = 20) {
    const items = await this.prisma.wishlist.findMany({
      where: { userId },
      take: limit + 1,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            salePrice: true,
            avgRating: true,
            reviewCount: true,
            isActive: true,
            images: {
              where: { isPrimary: true },
              select: { imageUrl: true },
              take: 1,
            },
          },
        },
      },
    });

    const hasNext = items.length > limit;
    const data = hasNext ? items.slice(0, limit) : items;
    const nextCursor = hasNext ? data[data.length - 1]?.id : null;

    return {
      items: data.map((w) => ({
        id: w.id,
        addedAt: w.createdAt,
        product: {
          ...w.product,
          thumbnail: w.product.images[0]?.imageUrl ?? null,
        },
      })),
      pagination: {
        hasNext,
        nextCursor,
      },
    };
  }

  /**
   * Xóa khỏi wishlist
   */
  async remove(userId: string, productId: string) {
    const existing = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (!existing) {
      throw new NotFoundException('Sản phẩm chưa có trong danh sách yêu thích');
    }

    await this.prisma.wishlist.delete({
      where: { id: existing.id },
    });

    return { message: 'Đã xóa khỏi danh sách yêu thích' };
  }

  /**
   * Kiểm tra sản phẩm đã yêu thích chưa
   */
  async check(userId: string, productId: string) {
    const existing = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    return { isWishlisted: !!existing };
  }
}
