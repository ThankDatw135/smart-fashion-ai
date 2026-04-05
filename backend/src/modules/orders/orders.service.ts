import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  Prisma,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../infrastructure/redis/redis.service.js';
import { RabbitmqService } from '../../infrastructure/rabbitmq/rabbitmq.service.js';
import { CACHE_KEYS } from '../../common/constants/cache-keys.js';
import { QUEUE_NAMES } from '../../common/constants/queue-names.js';
import {
  ORDER_NOT_FOUND,
  ORDER_INVALID_STATUS_TRANSITION,
  CHECKOUT_SESSION_NOT_FOUND,
  CHECKOUT_SESSION_EXPIRED,
  CHECKOUT_STOCK_INSUFFICIENT,
  PRODUCT_OUT_OF_STOCK,
  VOUCHER_NOT_FOUND,
  VOUCHER_EXPIRED,
  VOUCHER_USAGE_LIMIT,
  VOUCHER_MIN_ORDER,
  VOUCHER_ALREADY_USED,
} from '../../common/constants/error-codes.js';
import {
  CheckoutAddressDto,
  PaymentMethodEnum,
  OrderFilterDto,
  UpdateOrderStatusDto,
} from './dto/index.js';
import {
  decodeCursor,
  buildPaginationResponse,
} from '../../common/utils/pagination.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { VipService } from '../vip/vip.service.js';

// Ghi chú: Phí ship cố định theo 3 vùng (quyết định kỹ thuật đã chốt)
const SHIPPING_FEES: Record<string, number> = {
  // Vùng 1: Nội thành HCM, Hà Nội — 25.000đ
  'Hồ Chí Minh': 25000,
  'Hà Nội': 25000,
  // Vùng 2: Các thành phố lớn — 35.000đ
  'Đà Nẵng': 35000,
  'Cần Thơ': 35000,
  'Hải Phòng': 35000,
  'Bình Dương': 35000,
  'Đồng Nai': 35000,
};
const DEFAULT_SHIPPING_FEE = 50000; // Vùng 3: Tỉnh khác — 50.000đ

// Ghi chú: Checkout session TTL = 15 phút
const CHECKOUT_TTL = 15 * 60;

// Ghi chú: Valid order status transitions (theo tài liệu Phase 05)
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['shipping', 'cancelled'],
  shipping: ['delivered'],
  delivered: ['completed'],
  completed: [],
  cancelled: [],
};

/**
 * Orders Service — Checkout flow + Order management
 * - Init checkout → Lock stock
 * - Address → Shipping fee
 * - Voucher → Discount
 * - Confirm → Transaction lớn (10 bước)
 */
@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly rabbitmq: RabbitmqService,
    @InjectQueue(QUEUE_NAMES.MAIL) private readonly mailQueue: Queue,
    @InjectQueue(QUEUE_NAMES.ORDER_PROCESS)
    private readonly orderQueue: Queue,
    private readonly notifications: NotificationsService,
    private readonly vipService: VipService,
  ) {}

  // ===========================================================================
  // CHECKOUT — BƯỚC 1: Khởi tạo
  // ===========================================================================

  /**
   * Khởi tạo checkout session
   * - Validate cart items + stock
   * - Soft lock stock (Redis TTL 15 phút)
   * - Trả về checkoutId + items snapshot + subtotal
   */
  async initCheckout(userId: string, cartItemIds: string[]) {
    // 1. Lấy cart items
    const cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          where: { id: { in: cartItemIds } },
          include: {
            product: {
              select: {
                id: true,
                name: true,
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
                stockQuantity: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('CART_EMPTY');
    }

    // 2. Validate từng item
    const itemsSnapshot = [];
    let subtotal = 0;

    for (const item of cart.items) {
      if (!item.product.isActive) {
        throw new BadRequestException(
          `Sản phẩm "${item.product.name}" không còn hoạt động`,
        );
      }
      if (!item.variant.isActive) {
        throw new BadRequestException(`Phiên bản sản phẩm đã ngừng bán`);
      }
      if (item.variant.stockQuantity < item.quantity) {
        throw new BadRequestException(CHECKOUT_STOCK_INSUFFICIENT);
      }

      const price = item.product.salePrice
        ? Number(item.product.salePrice)
        : Number(item.product.price);

      itemsSnapshot.push({
        cartItemId: item.id,
        productId: item.product.id,
        variantId: item.variant.id,
        productName: item.product.name,
        variantInfo: `${item.variant.size} / ${item.variant.color}`,
        price,
        quantity: item.quantity,
        imageUrl: item.product.images[0]?.imageUrl || null,
        subtotal: price * item.quantity,
      });

      subtotal += price * item.quantity;
    }

    // 3. Tạo checkout session trong Redis
    const checkoutId = crypto.randomUUID();
    const session = {
      userId,
      items: itemsSnapshot,
      subtotal,
      shippingFee: 0,
      discount: 0,
      total: subtotal,
      address: null,
      voucherId: null,
      voucherCode: null,
      createdAt: new Date().toISOString(),
    };

    await this.redis.setJson(
      CACHE_KEYS.CHECKOUT_SESSION(checkoutId),
      session,
      CHECKOUT_TTL,
    );

    this.logger.log(
      `Checkout session tạo: ${checkoutId} (${itemsSnapshot.length} items)`,
    );

    return {
      checkoutId,
      items: itemsSnapshot,
      subtotal,
      expiresAt: new Date(Date.now() + CHECKOUT_TTL * 1000).toISOString(),
    };
  }

  // ===========================================================================
  // CHECKOUT — BƯỚC 2: Địa chỉ giao hàng
  // ===========================================================================

  /**
   * Cập nhật địa chỉ + tính phí ship
   */
  async updateAddress(checkoutId: string, dto: CheckoutAddressDto) {
    const session = await this.getCheckoutSession(checkoutId);

    // Tính phí ship theo tỉnh
    const shippingFee = SHIPPING_FEES[dto.province] || DEFAULT_SHIPPING_FEE;

    // Cập nhật session
    session.address = {
      fullName: dto.fullName,
      phone: dto.phone,
      province: dto.province,
      district: dto.district,
      ward: dto.ward,
      addressDetail: dto.addressDetail,
    };
    session.shippingFee = shippingFee;
    session.total = session.subtotal - session.discount + shippingFee;

    await this.redis.setJson(
      CACHE_KEYS.CHECKOUT_SESSION(checkoutId),
      session,
      CHECKOUT_TTL,
    );

    // Lưu địa chỉ mặc định nếu yêu cầu
    if (dto.saveAsDefault && session.userId) {
      await this.saveUserAddress(session.userId, dto);
    }

    return {
      shippingFee,
      subtotal: session.subtotal,
      discount: session.discount,
      total: session.total,
      address: session.address,
    };
  }

  // ===========================================================================
  // CHECKOUT — BƯỚC 3: Voucher
  // ===========================================================================

  /**
   * Áp dụng voucher cho checkout
   */
  async applyVoucher(checkoutId: string, voucherCode: string, userId: string) {
    const session = await this.getCheckoutSession(checkoutId);

    // Tìm voucher
    const voucher = await this.prisma.voucher.findUnique({
      where: { code: voucherCode },
    });
    if (!voucher || !voucher.isActive) {
      throw new NotFoundException(VOUCHER_NOT_FOUND);
    }

    // Validate
    const now = new Date();
    if (now < voucher.startDate || now > voucher.endDate) {
      throw new BadRequestException(VOUCHER_EXPIRED);
    }
    if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
      throw new BadRequestException(VOUCHER_USAGE_LIMIT);
    }
    if (Number(voucher.minOrderValue) > session.subtotal) {
      throw new BadRequestException(VOUCHER_MIN_ORDER);
    }

    // Kiểm tra user đã dùng chưa
    const used = await this.prisma.userVoucher.findUnique({
      where: {
        userId_voucherId: { userId, voucherId: voucher.id },
      },
    });
    if (used?.isUsed) {
      throw new BadRequestException(VOUCHER_ALREADY_USED);
    }

    // Tính discount
    let discount = 0;
    const voucherType = voucher.type as string;

    if (voucherType === 'percent') {
      discount = session.subtotal * (Number(voucher.value) / 100);
      if (voucher.maxDiscount) {
        discount = Math.min(discount, Number(voucher.maxDiscount));
      }
    } else if (voucherType === 'fixed_amount') {
      discount = Number(voucher.value);
    } else if (voucherType === 'free_ship') {
      session.shippingFee = 0;
    }

    session.discount = discount;
    session.voucherId = voucher.id;
    session.voucherCode = voucherCode;
    session.total = session.subtotal - discount + session.shippingFee;

    await this.redis.setJson(
      CACHE_KEYS.CHECKOUT_SESSION(checkoutId),
      session,
      CHECKOUT_TTL,
    );

    return {
      voucher: {
        code: voucher.code,
        type: voucher.type,
        value: Number(voucher.value),
      },
      discount,
      newTotal: session.total,
    };
  }

  /**
   * Bỏ voucher đã áp
   */
  async removeVoucher(checkoutId: string) {
    const session = await this.getCheckoutSession(checkoutId);

    session.discount = 0;
    session.voucherId = null;
    session.voucherCode = null;
    session.total = session.subtotal + session.shippingFee;

    await this.redis.setJson(
      CACHE_KEYS.CHECKOUT_SESSION(checkoutId),
      session,
      CHECKOUT_TTL,
    );

    return { total: session.total };
  }

  // ===========================================================================
  // CHECKOUT — BƯỚC 4: Xác nhận đơn hàng (TRANSACTION LỚN)
  // ===========================================================================

  /**
   * Xác nhận checkout → tạo đơn hàng chính thức
   * Transaction gồm 10 bước
   */
  async confirmCheckout(
    checkoutId: string,
    paymentMethod: PaymentMethodEnum,
    userId: string,
    note?: string,
  ) {
    const session = await this.getCheckoutSession(checkoutId);

    if (!session.address) {
      throw new BadRequestException('Vui lòng nhập địa chỉ giao hàng');
    }

    // Map payment method
    const paymentMethodMap: Record<string, PaymentMethod> = {
      cod: 'cod',
      momo: 'momo',
      bank_transfer: 'bank_transfer',
    };
    const dbPaymentMethod = paymentMethodMap[paymentMethod] || 'cod';

    // TRANSACTION LỚN
    const order = await this.prisma.$transaction(async (tx) => {
      // Bước 1: Re-validate stock
      for (const item of session.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: { stockQuantity: true },
        });
        if (!variant || variant.stockQuantity < item.quantity) {
          throw new ConflictException(PRODUCT_OUT_OF_STOCK);
        }
      }

      // Bước 2: Generate order number (SF-YYYYMMDD-NNN)
      const orderNumber = await this.generateOrderNumber(tx);

      // Bước 3: Create order
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: 'pending',
          subtotal: session.subtotal,
          shippingFee: session.shippingFee,
          discountAmount: session.discount,
          total: session.total,
          voucherId: session.voucherId || undefined,
          shippingName: session.address.fullName,
          shippingPhone: session.address.phone,
          shippingProvince: session.address.province,
          shippingDistrict: session.address.district,
          shippingWard: session.address.ward,
          shippingAddress: session.address.addressDetail,
          note: note || null,
        },
      });

      // Bước 4: Create order items (snapshot)
      await tx.orderItem.createMany({
        data: session.items.map(
          (item: {
            productId: string;
            variantId: string;
            productName: string;
            variantInfo: string;
            price: number;
            quantity: number;
            imageUrl: string | null;
          }) => ({
            orderId: created.id,
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            variantInfo: item.variantInfo,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl,
          }),
        ),
      });

      // Bước 5: Deduct stock (Optimistic Locking)
      for (const item of session.items) {
        const result = await tx.$executeRaw`
          UPDATE product_variants 
          SET stock_quantity = stock_quantity - ${item.quantity}
          WHERE id = ${item.variantId}::uuid AND stock_quantity >= ${item.quantity}
        `;
        if (result === 0) {
          throw new ConflictException(
            `Sản phẩm "${item.productName}" đã hết hàng`,
          );
        }
      }

      // Bước 6: Mark voucher used (nếu có)
      if (session.voucherId) {
        await tx.userVoucher.upsert({
          where: {
            userId_voucherId: {
              userId,
              voucherId: session.voucherId,
            },
          },
          create: {
            userId,
            voucherId: session.voucherId,
            isUsed: true,
            usedAt: new Date(),
          },
          update: {
            isUsed: true,
            usedAt: new Date(),
          },
        });
        await tx.voucher.update({
          where: { id: session.voucherId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Bước 7: Create payment record
      await tx.payment.create({
        data: {
          orderId: created.id,
          method: dbPaymentMethod,
          status: 'pending',
          amount: session.total,
        },
      });

      // Bước 8: Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: created.id,
          status: 'pending',
          note: 'Đơn hàng đã được tạo',
          changedBy: userId,
        },
      });

      // Bước 9: Clear cart items đã checkout
      const cartItemIds = session.items.map(
        (i: { cartItemId: string }) => i.cartItemId,
      );
      await tx.cartItem.deleteMany({
        where: { id: { in: cartItemIds } },
      });

      // Bước 10: Update soldCount cho mỗi product
      const productQtyMap = new Map<string, number>();
      for (const item of session.items) {
        const current = productQtyMap.get(item.productId) || 0;
        productQtyMap.set(item.productId, current + item.quantity);
      }
      for (const [productId, qty] of productQtyMap) {
        await tx.product.update({
          where: { id: productId },
          data: { soldCount: { increment: qty } },
        });
      }

      return created;
    });

    // Bước 11: Xóa checkout session (Redis)
    await this.redis.del(CACHE_KEYS.CHECKOUT_SESSION(checkoutId));

    // Bước 12: Gửi email xác nhận đơn hàng (qua NotificationsService)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true },
    });
    if (user) {
      await this.notifications.sendOrderConfirmationEmail({
        email: user.email,
        fullName: user.fullName || user.email.split('@')[0],
        orderNumber: order.orderNumber,
        items: session.items.map(
          (item: {
            productName: string;
            variantInfo: string;
            quantity: number;
            price: number;
          }) => ({
            productName: item.productName,
            variantInfo: item.variantInfo,
            quantity: item.quantity,
            subtotal: (item.price * item.quantity).toLocaleString('vi-VN'),
          }),
        ),
        subtotal: session.subtotal.toLocaleString('vi-VN'),
        shippingFee: session.shippingFee.toLocaleString('vi-VN'),
        discount:
          session.discount > 0
            ? session.discount.toLocaleString('vi-VN')
            : undefined,
        total: session.total.toLocaleString('vi-VN'),
        shippingName: session.address.fullName,
        shippingPhone: session.address.phone,
        shippingAddress: session.address.addressDetail,
        shippingWard: session.address.ward,
        shippingDistrict: session.address.district,
        shippingProvince: session.address.province,
      });
    }

    // Bước 13: Notify admin về đơn mới (in-app notification)
    await this.notifications.notifyAdminNewOrder({
      orderNumber: order.orderNumber,
      customerName: user?.fullName || 'Khách hàng',
      total: session.total,
      itemCount: session.items.length,
    });

    // Bước 14: Publish event → AI Service
    await this.rabbitmq.publish('sf.order.events', 'order.created', {
      orderId: order.id,
      userId,
      items: session.items,
      total: session.total,
    });

    this.logger.log(`✅ Đơn hàng đã tạo: ${order.orderNumber}`);

    return {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: Number(order.total),
      },
      message: 'Đặt hàng thành công!',
    };
  }

  // ===========================================================================
  // USER — Lịch sử đơn hàng
  // ===========================================================================

  /**
   * Lịch sử đơn hàng user
   */
  async getUserOrders(userId: string, filter: OrderFilterDto) {
    const limit = filter.limit || 10;
    const where: Prisma.OrderWhereInput = { userId };

    if (filter.status) {
      where.status = filter.status as OrderStatus;
    }

    const cursorOption: Prisma.OrderFindManyArgs = {};
    if (filter.cursor) {
      cursorOption.cursor = { id: decodeCursor(filter.cursor) };
      cursorOption.skip = 1;
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...cursorOption,
      include: {
        items: {
          select: {
            productName: true,
            variantInfo: true,
            price: true,
            quantity: true,
            imageUrl: true,
          },
        },
        payment: { select: { method: true, status: true } },
      },
    });

    return buildPaginationResponse(orders, limit);
  }

  /**
   * Chi tiết đơn hàng user (verify ownership)
   */
  async getUserOrderDetail(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payment: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException(ORDER_NOT_FOUND);
    }

    return order;
  }

  // ===========================================================================
  // ADMIN — Quản lý đơn hàng
  // ===========================================================================

  /**
   * Danh sách đơn hàng (Admin)
   */
  async getAdminOrders(filter: OrderFilterDto) {
    const limit = filter.limit || 20;
    const where: Prisma.OrderWhereInput = {};

    if (filter.status) {
      where.status = filter.status as OrderStatus;
    }
    if (filter.search) {
      where.OR = [
        { orderNumber: { contains: filter.search, mode: 'insensitive' } },
        { shippingName: { contains: filter.search, mode: 'insensitive' } },
        { shippingPhone: { contains: filter.search } },
      ];
    }

    const cursorOption: Prisma.OrderFindManyArgs = {};
    if (filter.cursor) {
      cursorOption.cursor = { id: decodeCursor(filter.cursor) };
      cursorOption.skip = 1;
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...cursorOption,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        items: {
          select: {
            productName: true,
            quantity: true,
            price: true,
          },
        },
        payment: { select: { method: true, status: true } },
      },
    });

    return buildPaginationResponse(orders, limit);
  }

  /**
   * Chi tiết đơn hàng (Admin)
   */
  async getAdminOrderDetail(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        items: {
          include: {
            product: { select: { slug: true } },
          },
        },
        payment: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            changer: { select: { fullName: true } },
          },
        },
        voucher: { select: { code: true, type: true, value: true } },
      },
    });

    if (!order) throw new NotFoundException(ORDER_NOT_FOUND);
    return order;
  }

  /**
   * Cập nhật trạng thái đơn hàng (Admin)
   * Validate transition: pending→confirmed→shipping→delivered→completed
   */
  async updateOrderStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
    adminId: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, orderNumber: true },
    });
    if (!order) throw new NotFoundException(ORDER_NOT_FOUND);

    // Validate transition
    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(ORDER_INVALID_STATUS_TRANSITION);
    }

    await this.prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: { status: dto.status as OrderStatus },
      });

      // Add status history
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: dto.status as OrderStatus,
          note: dto.note || null,
          changedBy: adminId,
        },
      });

      // Nếu cancel → revert stock
      if (dto.status === 'cancelled') {
        const items = await tx.orderItem.findMany({
          where: { orderId },
        });
        for (const item of items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }
        // Update cancel info
        await tx.order.update({
          where: { id: orderId },
          data: {
            cancelledBy: 'admin',
            cancelReason: dto.note || 'Admin hủy đơn',
          },
        });
      }

      // Nếu delivered → update payment status cho COD
      if (dto.status === 'delivered') {
        await tx.payment.updateMany({
          where: { orderId, method: 'cod' },
          data: { status: 'success', paidAt: new Date() },
        });
      }
    });

    // Nếu completed → VIP auto-upgrade
    if (dto.status === 'completed') {
      const fullOrder = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { userId: true, total: true },
      });
      if (fullOrder?.userId) {
        await this.vipService.processOrderCompleted(
          fullOrder.userId,
          Number(fullOrder.total),
        );
      }
    }

    // Publish event
    await this.rabbitmq.publish('sf.order.events', 'order.status.changed', {
      orderId,
      orderNumber: order.orderNumber,
      oldStatus: order.status,
      newStatus: dto.status,
    });

    this.logger.log(
      `Đơn ${order.orderNumber}: ${order.status} → ${dto.status}`,
    );

    return this.getAdminOrderDetail(orderId);
  }

  // ===========================================================================
  // USER CANCEL ORDER
  // ===========================================================================

  /**
   * User hủy đơn hàng
   * Chỉ cho phép ở trạng thái: pending, confirmed, preparing
   */
  async cancelOrder(orderId: string, userId: string, reason?: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: true,
        voucher: true,
      },
    });

    if (!order) throw new NotFoundException(ORDER_NOT_FOUND);

    // Chỉ cho phép hủy ở 3 trạng thái đầu
    const cancellableStatuses: OrderStatus[] = [
      'pending',
      'confirmed',
      'preparing',
    ];
    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException(
        'Không thể hủy đơn hàng ở trạng thái hiện tại. Vui lòng liên hệ CSKH.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Update trạng thái cancelled
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          cancelledBy: 'user',
          cancelReason: reason || 'User hủy đơn',
        },
      });

      // 2. Log status history
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: 'cancelled',
          note: reason || 'User hủy đơn',
          changedBy: userId,
        },
      });

      // 3. Restore stock
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }

      // 4. Release voucher (nếu có)
      if (order.voucherId) {
        await tx.voucher.update({
          where: { id: order.voucherId },
          data: { usedCount: { decrement: 1 } },
        });
        await tx.userVoucher.updateMany({
          where: { userId, voucherId: order.voucherId },
          data: { isUsed: false, usedAt: null },
        });
      }
    });

    // 5. Notify admin
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['admin', 'super_admin'] } },
      select: { id: true },
    });
    if (admins.length > 0) {
      await this.prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: 'order_update' as const,
          title: `❌ Đơn ${order.orderNumber} bị hủy bởi khách`,
          message: reason || 'Khách hàng hủy đơn',
          data: { orderId, orderNumber: order.orderNumber },
          channel: 'in_app' as const,
        })),
      });
    }

    this.logger.log(
      `User hủy đơn ${order.orderNumber}: ${reason || 'Không rõ lý do'}`,
    );

    return { message: 'Đã hủy đơn hàng thành công' };
  }

  // ===========================================================================
  // CRON: AUTO-COMPLETE ORDERS
  // ===========================================================================

  /**
   * Tự động chuyển đơn delivered → completed sau 3 ngày
   * Chạy mỗi ngày lúc 2:00 AM
   */
  @Cron('0 2 * * *', { name: 'auto-complete-orders' })
  async autoCompleteOrders() {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Tìm đơn delivered quá 3 ngày
    const orders = await this.prisma.order.findMany({
      where: {
        status: 'delivered',
        updatedAt: { lt: threeDaysAgo },
      },
      select: { id: true, userId: true, total: true, orderNumber: true },
    });

    if (orders.length === 0) return;

    this.logger.log(
      `⏰ Auto-complete: Tìm thấy ${orders.length} đơn hàng delivered > 3 ngày`,
    );

    for (const order of orders) {
      try {
        // Update status
        await this.prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: { status: 'completed' },
          });

          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              status: 'completed',
              note: 'Hệ thống tự động đánh dấu hoàn thành (sau 3 ngày giao hàng)',
            },
          });
        });

        // VIP auto-upgrade
        if (order.userId) {
          await this.vipService.processOrderCompleted(
            order.userId,
            Number(order.total),
          );
        }

        this.logger.log(`✅ Auto-completed: ${order.orderNumber}`);
      } catch (error) {
        this.logger.error(
          `Auto-complete thất bại cho ${order.orderNumber}: ${(error as Error).message}`,
        );
      }
    }
  }

  // ===========================================================================
  // HELPER
  // ===========================================================================

  /**
   * Lấy và validate checkout session từ Redis
   */

  private async getCheckoutSession(checkoutId: string): Promise<any> {
    const session = await this.redis.getJson(
      CACHE_KEYS.CHECKOUT_SESSION(checkoutId),
    );
    if (!session) {
      throw new NotFoundException(CHECKOUT_SESSION_EXPIRED);
    }
    return session;
  }

  /**
   * Generate order number: SF-YYYYMMDD-NNN
   */

  private async generateOrderNumber(tx: any): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `SF-${dateStr}`;

    // Đếm đơn hàng hôm nay
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const count = await tx.order.count({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    const seq = String(count + 1).padStart(3, '0');
    return `${prefix}-${seq}`;
  }

  /**
   * Lưu địa chỉ mặc định cho user
   */
  private async saveUserAddress(userId: string, dto: CheckoutAddressDto) {
    // Bỏ mặc định cũ
    await this.prisma.userAddress.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    // Tạo mới
    await this.prisma.userAddress.create({
      data: {
        userId,
        fullName: dto.fullName,
        phone: dto.phone,
        province: dto.province,
        district: dto.district,
        ward: dto.ward,
        addressDetail: dto.addressDetail,
        isDefault: true,
      },
    });
  }
}
