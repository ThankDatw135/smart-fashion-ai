import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service.js';
import { QUEUE_NAMES } from '../../common/constants/queue-names.js';

// Ghi chú: Ngưỡng cảnh báo tồn kho thấp (stock <= 5)
const LOW_STOCK_THRESHOLD = 5;

/**
 * Notifications Service — xử lý thông báo hệ thống
 * - Low stock alert: quét mỗi 30 phút, tạo notification admin + gửi email
 * - Order notify: tạo notification in-app cho admin khi có đơn mới
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.MAIL) private readonly mailQueue: Queue,
  ) {}

  // ===========================================================================
  // LOW STOCK ALERT — Chạy mỗi 30 phút
  // ===========================================================================

  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkLowStock() {
    this.logger.log('🔍 Đang quét tồn kho thấp...');

    // 1. Tìm variants có stock <= threshold
    const lowStockVariants = await this.prisma.productVariant.findMany({
      where: {
        stockQuantity: { lte: LOW_STOCK_THRESHOLD },
        product: { isActive: true },
      },
      include: {
        product: { select: { name: true } },
      },
      orderBy: { stockQuantity: 'asc' },
    });

    if (lowStockVariants.length === 0) {
      this.logger.log('✅ Không có sản phẩm nào tồn kho thấp');
      return;
    }

    this.logger.warn(
      `⚠️ Phát hiện ${lowStockVariants.length} variants tồn kho thấp`,
    );

    // 2. Tìm tất cả admin users
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['admin', 'super_admin'] }, isActive: true },
      select: { id: true, email: true },
    });

    // 3. Tạo notification in-app cho mỗi admin
    const notificationData = lowStockVariants.map((v) => ({
      productName: v.product.name,
      size: v.size,
      color: v.color,
      stockQuantity: v.stockQuantity,
    }));

    for (const admin of admins) {
      // Tạo notification in-app
      await this.prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'system',
          title: `⚠️ Cảnh báo tồn kho thấp — ${lowStockVariants.length} sản phẩm`,
          message: lowStockVariants
            .slice(0, 5)
            .map(
              (v) =>
                `${v.product.name} (${v.size}/${v.color}): còn ${v.stockQuantity}`,
            )
            .join('\n'),
          data: { variants: notificationData },
          channel: 'in_app',
        },
      });

      // Gửi email cảnh báo qua BullMQ
      await this.mailQueue.add('send-low-stock-alert', {
        email: admin.email,
        totalVariants: lowStockVariants.length,
        variants: notificationData,
      });
    }

    this.logger.log(
      `✅ Đã tạo ${admins.length} notifications + gửi email cảnh báo`,
    );
  }

  // ===========================================================================
  // ORDER NOTIFICATION — Khi có đơn hàng mới
  // ===========================================================================

  /**
   * Tạo notification in-app cho admin khi có đơn mới
   * Được gọi từ OrdersService sau khi confirm checkout
   */
  async notifyAdminNewOrder(orderData: {
    orderNumber: string;
    customerName: string;
    total: number;
    itemCount: number;
  }) {
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['admin', 'super_admin'] }, isActive: true },
      select: { id: true },
    });

    const notifications = admins.map((admin) => ({
      userId: admin.id,
      type: 'order_update' as const,
      title: `🛒 Đơn hàng mới: ${orderData.orderNumber}`,
      message: `${orderData.customerName} đã đặt ${orderData.itemCount} sản phẩm — Tổng: ${orderData.total.toLocaleString('vi-VN')}đ`,
      data: orderData,
      channel: 'in_app' as const,
    }));

    await this.prisma.notification.createMany({
      data: notifications,
    });

    this.logger.log(
      `✅ Đã notify ${admins.length} admin về đơn mới: ${orderData.orderNumber}`,
    );
  }

  /**
   * Gửi email xác nhận đơn hàng cho customer
   * Được gọi từ OrdersService sau khi confirm checkout
   */
  async sendOrderConfirmationEmail(emailData: {
    email: string;
    fullName: string;
    orderNumber: string;
    items: Array<{
      productName: string;
      variantInfo: string;
      quantity: number;
      subtotal: string;
    }>;
    subtotal: string;
    shippingFee: string;
    discount?: string;
    total: string;
    shippingName: string;
    shippingPhone: string;
    shippingAddress: string;
    shippingWard: string;
    shippingDistrict: string;
    shippingProvince: string;
  }) {
    await this.mailQueue.add('send-order-confirmation', emailData);
    this.logger.log(
      `📧 Email xác nhận đơn hàng đã enqueue: ${emailData.orderNumber}`,
    );
  }
}
