import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../infrastructure/redis/redis.service.js';
import { CACHE_KEYS } from '../../common/constants/cache-keys.js';
import {
  CART_NOT_FOUND,
  CART_ITEM_NOT_FOUND,
  CART_EMPTY,
  PRODUCT_NOT_FOUND,
  PRODUCT_OUT_OF_STOCK,
} from '../../common/constants/error-codes.js';
import { AddCartItemDto, UpdateCartItemDto } from './dto/index.js';

// Ghi chú: Interface cho item lưu trong Redis (guest cart)
interface GuestCartItem {
  productId: string;
  variantId: string;
  quantity: number;
  priceSnapshot: number;
  addedAt: string;
}

/**
 * Cart Service — quản lý giỏ hàng Guest (Redis) + User (PostgreSQL)
 *
 * Guest cart: lưu Redis Hash (TTL 30 ngày)
 * User cart: lưu PostgreSQL (carts + cart_items)
 * Merge: khi login → gộp guest cart vào user cart
 */
@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  private readonly GUEST_CART_TTL = 30 * 24 * 60 * 60; // 30 ngày

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ===========================================================================
  // GUEST CART — Redis
  // ===========================================================================

  /**
   * Thêm item vào giỏ khách (Redis)
   * Key: cart:guest:{guestId}, Field: {variantId}
   */
  async addGuestItem(guestId: string, dto: AddCartItemDto) {
    // 1. Validate variant tồn tại + còn stock
    const variant = await this.validateVariantStock(
      dto.variantId,
      dto.quantity,
    );

    // 2. Lấy giá hiện tại để snapshot
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId, isActive: true },
      select: { price: true, salePrice: true },
    });
    if (!product) throw new NotFoundException(PRODUCT_NOT_FOUND);

    const price = product.salePrice
      ? Number(product.salePrice)
      : Number(product.price);

    // 3. Kiểm tra item đã có trong cart chưa
    const cacheKey = CACHE_KEYS.GUEST_CART(guestId);
    const existingRaw = await this.redis.hget(cacheKey, dto.variantId);

    let newQty = dto.quantity;
    if (existingRaw) {
      const existing = JSON.parse(existingRaw) as GuestCartItem;
      newQty = existing.quantity + dto.quantity;
      // Validate tổng lượng không vượt stock
      if (newQty > variant.stockQuantity) {
        throw new BadRequestException(PRODUCT_OUT_OF_STOCK);
      }
    }

    // 4. Lưu vào Redis Hash
    const item: GuestCartItem = {
      productId: dto.productId,
      variantId: dto.variantId,
      quantity: newQty,
      priceSnapshot: price,
      addedAt: new Date().toISOString(),
    };

    await this.redis.hset(cacheKey, dto.variantId, JSON.stringify(item));
    await this.redis.expire(cacheKey, this.GUEST_CART_TTL);

    this.logger.debug(`Guest cart updated: ${guestId} → ${dto.variantId}`);
    return this.getGuestCart(guestId);
  }

  /**
   * Lấy giỏ hàng khách — resolve product info từ DB
   */
  async getGuestCart(guestId: string) {
    const cacheKey = CACHE_KEYS.GUEST_CART(guestId);
    const allItems = await this.redis.hgetall(cacheKey);

    if (!allItems || Object.keys(allItems).length === 0) {
      return { items: [], totalItems: 0, subtotal: 0 };
    }

    const cartItems: GuestCartItem[] = Object.values(allItems).map(
      (raw) => JSON.parse(raw) as GuestCartItem,
    );

    // Resolve product info
    const variantIds = cartItems.map((i) => i.variantId);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds }, isActive: true },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            salePrice: true,
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

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    const items = cartItems
      .map((ci) => {
        const variant = variantMap.get(ci.variantId);
        if (!variant || !variant.product.isActive) return null;

        const currentPrice = variant.product.salePrice
          ? Number(variant.product.salePrice)
          : Number(variant.product.price);

        return {
          variantId: ci.variantId,
          productId: ci.productId,
          quantity: ci.quantity,
          product: {
            name: variant.product.name,
            slug: variant.product.slug,
            primaryImage: variant.product.images[0]?.imageUrl || null,
          },
          variant: {
            size: variant.size,
            color: variant.color,
            stockQuantity: variant.stockQuantity,
          },
          price: currentPrice,
          priceChanged: currentPrice !== ci.priceSnapshot,
          subtotal: currentPrice * ci.quantity,
        };
      })
      .filter(Boolean);

    const subtotal = items.reduce((sum, i) => sum + (i?.subtotal || 0), 0);

    return {
      items,
      totalItems: items.length,
      subtotal,
    };
  }

  /**
   * Cập nhật số lượng item trong giỏ khách
   */
  async updateGuestItem(
    guestId: string,
    variantId: string,
    dto: UpdateCartItemDto,
  ) {
    const cacheKey = CACHE_KEYS.GUEST_CART(guestId);
    const existingRaw = await this.redis.hget(cacheKey, variantId);
    if (!existingRaw) throw new NotFoundException(CART_ITEM_NOT_FOUND);

    // Validate stock
    await this.validateVariantStock(variantId, dto.quantity);

    const existing = JSON.parse(existingRaw) as GuestCartItem;
    existing.quantity = dto.quantity;

    await this.redis.hset(cacheKey, variantId, JSON.stringify(existing));
    return this.getGuestCart(guestId);
  }

  /**
   * Xóa item khỏi giỏ khách
   */
  async removeGuestItem(guestId: string, variantId: string) {
    const cacheKey = CACHE_KEYS.GUEST_CART(guestId);
    await this.redis.hdel(cacheKey, variantId);
    return this.getGuestCart(guestId);
  }

  /**
   * Xóa toàn bộ giỏ khách
   */
  async clearGuestCart(guestId: string) {
    const cacheKey = CACHE_KEYS.GUEST_CART(guestId);
    await this.redis.del(cacheKey);
    return { items: [], totalItems: 0, subtotal: 0 };
  }

  // ===========================================================================
  // USER CART — PostgreSQL
  // ===========================================================================

  /**
   * Thêm item vào giỏ user (DB)
   * Nếu variantId đã có → cộng dồn quantity
   */
  async addUserItem(userId: string, dto: AddCartItemDto) {
    // 1. Validate variant + stock
    const variant = await this.validateVariantStock(
      dto.variantId,
      dto.quantity,
    );

    // 2. Validate product active
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId, isActive: true },
      select: { id: true },
    });
    if (!product) throw new NotFoundException(PRODUCT_NOT_FOUND);

    // 3. Get or create cart
    let cart = await this.prisma.cart.findFirst({
      where: { userId },
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
      });
    }

    // 4. Kiểm tra item đã có chưa
    const existingItem = await this.prisma.cartItem.findFirst({
      where: { cartId: cart.id, variantId: dto.variantId },
    });

    if (existingItem) {
      const newQty = existingItem.quantity + dto.quantity;
      if (newQty > variant.stockQuantity) {
        throw new BadRequestException(PRODUCT_OUT_OF_STOCK);
      }
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId,
          quantity: dto.quantity,
        },
      });
    }

    return this.getUserCart(userId);
  }

  /**
   * Lấy giỏ hàng user — include product/variant info
   */
  async getUserCart(userId: string) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                salePrice: true,
                isActive: true,
                images: {
                  where: { isPrimary: true },
                  select: { imageUrl: true },
                  take: 1,
                },
              },
            },
            variant: {
              select: {
                id: true,
                size: true,
                color: true,
                colorCode: true,
                stockQuantity: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return { items: [], totalItems: 0, subtotal: 0 };
    }

    // Enrich items với giá hiện tại và trạng thái
    const items = cart.items
      .filter((i) => i.product.isActive && i.variant.isActive)
      .map((i) => {
        const price = i.product.salePrice
          ? Number(i.product.salePrice)
          : Number(i.product.price);
        return {
          id: i.id,
          variantId: i.variant.id,
          productId: i.product.id,
          quantity: i.quantity,
          product: {
            name: i.product.name,
            slug: i.product.slug,
            primaryImage: i.product.images[0]?.imageUrl || null,
          },
          variant: {
            size: i.variant.size,
            color: i.variant.color,
            colorCode: i.variant.colorCode,
            stockQuantity: i.variant.stockQuantity,
          },
          price,
          isInStock: i.variant.stockQuantity >= i.quantity,
          subtotal: price * i.quantity,
        };
      });

    const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);

    return {
      cartId: cart.id,
      items,
      totalItems: items.length,
      subtotal,
    };
  }

  /**
   * Cập nhật số lượng item trong giỏ user
   */
  async updateUserItem(
    userId: string,
    variantId: string,
    dto: UpdateCartItemDto,
  ) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: { items: true },
    });
    if (!cart) throw new NotFoundException(CART_NOT_FOUND);

    const item = cart.items.find((i) => i.variantId === variantId);
    if (!item) throw new NotFoundException(CART_ITEM_NOT_FOUND);

    // Validate stock
    await this.validateVariantStock(variantId, dto.quantity);

    await this.prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: dto.quantity },
    });

    return this.getUserCart(userId);
  }

  /**
   * Xóa item khỏi giỏ user
   */
  async removeUserItem(userId: string, variantId: string) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: { items: true },
    });
    if (!cart) throw new NotFoundException(CART_NOT_FOUND);

    const item = cart.items.find((i) => i.variantId === variantId);
    if (!item) throw new NotFoundException(CART_ITEM_NOT_FOUND);

    await this.prisma.cartItem.delete({ where: { id: item.id } });
    return this.getUserCart(userId);
  }

  /**
   * Xóa toàn bộ giỏ user
   */
  async clearUserCart(userId: string) {
    const cart = await this.prisma.cart.findFirst({ where: { userId } });
    if (cart) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return { items: [], totalItems: 0, subtotal: 0 };
  }

  // ===========================================================================
  // MERGE — Guest → User
  // ===========================================================================

  /**
   * Gộp giỏ khách vào giỏ user khi đăng nhập
   * Logic: variantId trùng → qty = MAX(guest, user); khác → thêm mới
   */
  async mergeGuestCartToUser(userId: string, guestId: string) {
    const cacheKey = CACHE_KEYS.GUEST_CART(guestId);
    const allItems = await this.redis.hgetall(cacheKey);

    if (!allItems || Object.keys(allItems).length === 0) {
      this.logger.debug(`No guest cart to merge for: ${guestId}`);
      return this.getUserCart(userId);
    }

    const guestItems: GuestCartItem[] = Object.values(allItems).map(
      (raw) => JSON.parse(raw) as GuestCartItem,
    );

    // Get or create user cart
    let cart = await this.prisma.cart.findFirst({ where: { userId } });
    if (!cart) {
      cart = await this.prisma.cart.create({ data: { userId } });
    }

    // Get existing user cart items
    const userItems = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
    });
    const userItemMap = new Map(userItems.map((i) => [i.variantId, i]));

    // Merge logic trong transaction
    await this.prisma.$transaction(async (tx) => {
      for (const guestItem of guestItems) {
        const userItem = userItemMap.get(guestItem.variantId);

        // Validate variant còn hợp lệ
        const variant = await tx.productVariant.findUnique({
          where: { id: guestItem.variantId },
          select: { stockQuantity: true, isActive: true },
        });
        if (!variant || !variant.isActive) continue;

        const mergedQty = userItem
          ? Math.max(guestItem.quantity, userItem.quantity)
          : guestItem.quantity;

        // Giới hạn bởi stock thực tế
        const finalQty = Math.min(mergedQty, variant.stockQuantity);

        if (userItem) {
          // Cập nhật qty nếu đã có
          await tx.cartItem.update({
            where: { id: userItem.id },
            data: { quantity: finalQty },
          });
        } else {
          // Thêm mới
          await tx.cartItem.create({
            data: {
              cartId: cart.id,
              productId: guestItem.productId,
              variantId: guestItem.variantId,
              quantity: finalQty,
            },
          });
        }
      }
    });

    // Xóa guest cart sau khi merge
    await this.redis.del(cacheKey);
    this.logger.log(
      `Merged guest cart (${guestItems.length} items) → user:${userId}`,
    );

    return this.getUserCart(userId);
  }

  // ===========================================================================
  // HELPER
  // ===========================================================================

  /**
   * Validate variant tồn tại, active, đủ stock
   */
  private async validateVariantStock(variantId: string, quantity: number) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { stockQuantity: true, isActive: true },
    });

    if (!variant || !variant.isActive) {
      throw new NotFoundException('PRODUCT_VARIANT_NOT_FOUND');
    }

    if (variant.stockQuantity < quantity) {
      throw new BadRequestException(PRODUCT_OUT_OF_STOCK);
    }

    return variant;
  }
}
