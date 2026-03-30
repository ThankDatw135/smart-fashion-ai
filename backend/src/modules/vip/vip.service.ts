import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { VipTier } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { QUEUE_NAMES } from '../../common/constants/queue-names.js';

// Ghi chú: Ngưỡng chi tiêu để lên hạng VIP (đơn vị: VND)
const VIP_THRESHOLDS: { tier: VipTier; minSpent: number }[] = [
  { tier: 'diamond', minSpent: 20_000_000 },
  { tier: 'gold', minSpent: 10_000_000 },
  { tier: 'silver', minSpent: 2_000_000 },
];

// Ghi chú: Voucher tặng kèm khi lên hạng VIP
const VIP_VOUCHER_CONFIG: Record<
  string,
  { percent: number; maxDiscount: number; label: string }
> = {
  silver: { percent: 5, maxDiscount: 50_000, label: 'Bạc 🥈' },
  gold: { percent: 10, maxDiscount: 150_000, label: 'Vàng 🥇' },
  diamond: { percent: 15, maxDiscount: 300_000, label: 'Kim Cương 💎' },
};

/**
 * VIP Service — Quản lý hệ thống VIP tự động
 * - Cộng totalSpent khi order completed
 * - Auto-upgrade tier dựa trên ngưỡng chi tiêu
 * - Tặng voucher VIP khi lên hạng
 * - Gửi email + notification chúc mừng
 */
@Injectable()
export class VipService {
  private readonly logger = new Logger(VipService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.MAIL) private readonly mailQueue: Queue,
  ) {}

  /**
   * Xử lý VIP khi đơn hàng hoàn thành
   * Gọi từ OrdersService khi status → completed
   */
  async processOrderCompleted(userId: string, orderTotal: number) {
    // 1. Cộng totalSpent
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { totalSpent: { increment: orderTotal } },
      select: {
        id: true,
        email: true,
        fullName: true,
        vipTier: true,
        totalSpent: true,
      },
    });

    const newTotalSpent = Number(user.totalSpent);
    this.logger.log(
      `Cộng chi tiêu: ${user.fullName} — +${orderTotal.toLocaleString('vi-VN')}đ → Tổng: ${newTotalSpent.toLocaleString('vi-VN')}đ`,
    );

    // 2. Check tier upgrade
    const newTier = this.calculateTier(newTotalSpent);

    if (newTier !== user.vipTier && newTier !== 'none') {
      await this.upgradeTier(user.id, user.email, user.fullName, newTier);
    }
  }

  /**
   * Tính toán tier dựa trên tổng chi tiêu
   */
  private calculateTier(totalSpent: number): VipTier {
    for (const threshold of VIP_THRESHOLDS) {
      if (totalSpent >= threshold.minSpent) {
        return threshold.tier;
      }
    }
    return 'none';
  }

  /**
   * Nâng hạng VIP — update user + tạo voucher + notify + email
   */
  private async upgradeTier(
    userId: string,
    email: string,
    fullName: string,
    newTier: VipTier,
  ) {
    const config = VIP_VOUCHER_CONFIG[newTier];
    if (!config) return;

    this.logger.log(`🎉 VIP Upgrade: ${fullName} → ${config.label}`);

    await this.prisma.$transaction(async (tx) => {
      // A. Update user tier
      await tx.user.update({
        where: { id: userId },
        data: { vipTier: newTier },
      });

      // B. Tạo voucher VIP tặng kèm
      const voucherCode = `VIP-${newTier.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      const now = new Date();
      const expireDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 ngày

      const voucher = await tx.voucher.create({
        data: {
          code: voucherCode,
          type: 'percent',
          value: config.percent,
          minOrderValue: 0,
          maxDiscount: config.maxDiscount,
          usageLimit: 1,
          vipOnly: newTier,
          startDate: now,
          endDate: expireDate,
          isActive: true,
          createdBy: userId, // Hệ thống tạo, gán cho user
        },
      });

      // C. Gán voucher cho user
      await tx.userVoucher.create({
        data: {
          userId,
          voucherId: voucher.id,
        },
      });

      // D. Tạo notification in-app
      await tx.notification.create({
        data: {
          userId,
          type: 'vip_upgrade',
          title: `🎉 Chúc mừng bạn lên VIP ${config.label}!`,
          message: `Bạn đã được nâng hạng VIP ${config.label}. Tặng voucher giảm ${config.percent}% (tối đa ${config.maxDiscount.toLocaleString('vi-VN')}đ), hạn 30 ngày.`,
          data: {
            tier: newTier,
            voucherCode,
            percent: config.percent,
            maxDiscount: config.maxDiscount,
          },
          channel: 'in_app',
        },
      });
    });

    // E. Gửi email chúc mừng (BullMQ async)
    await this.mailQueue.add('send-vip-upgrade', {
      email,
      fullName,
      tier: newTier,
      tierLabel: config.label,
      percent: config.percent,
      maxDiscount: config.maxDiscount.toLocaleString('vi-VN'),
    });
  }
}
