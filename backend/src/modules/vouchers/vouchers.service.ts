import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateVoucherDto, UpdateVoucherDto } from './dto/index.js';

/**
 * Voucher Service — Quản lý mã giảm giá
 * - CRUD cho Admin
 * - Cron auto-expire mỗi giờ
 * - Kiểm tra voucher hợp lệ cho checkout
 */
@Injectable()
export class VouchersService {
  private readonly logger = new Logger(VouchersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // ADMIN CRUD
  // ===========================================================================

  /**
   * Tạo voucher mới — Admin only
   */
  async create(dto: CreateVoucherDto, adminId: string) {
    // Validate: mã unique
    const existing = await this.prisma.voucher.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(`Mã voucher "${dto.code}" đã tồn tại`);
    }

    // Validate: ngày kết thúc > ngày bắt đầu
    if (new Date(dto.endDate) <= new Date(dto.startDate)) {
      throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu');
    }

    // Validate: maxDiscount bắt buộc cho type percent
    if (dto.type === 'percent' && !dto.maxDiscount) {
      throw new BadRequestException(
        'Voucher loại phần trăm bắt buộc có giảm tối đa (maxDiscount)',
      );
    }

    return this.prisma.voucher.create({
      data: {
        code: dto.code.toUpperCase(),
        type: dto.type,
        value: dto.value,
        minOrderValue: dto.minOrderValue,
        maxDiscount: dto.maxDiscount ?? null,
        usageLimit: dto.usageLimit ?? null,
        vipOnly: dto.vipOnly ?? null,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        createdBy: adminId,
      },
    });
  }

  /**
   * Danh sách voucher — Admin (cursor pagination + filter)
   */
  async findAll(params: {
    cursor?: string;
    limit?: number;
    filter?: 'all' | 'active' | 'expired' | 'inactive';
  }) {
    const { cursor, limit = 20, filter = 'all' } = params;
    const now = new Date();

    // Xây dựng where clause dựa trên filter
    const where: Prisma.VoucherWhereInput = {};
    switch (filter) {
      case 'active':
        where.isActive = true;
        where.endDate = { gt: now };
        break;
      case 'expired':
        where.endDate = { lt: now };
        break;
      case 'inactive':
        where.isActive = false;
        break;
    }

    const vouchers = await this.prisma.voucher.findMany({
      where,
      take: limit + 1, // Lấy thêm 1 để check hasNext
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { userVouchers: true, orders: true } },
      },
    });

    const hasNext = vouchers.length > limit;
    const items = hasNext ? vouchers.slice(0, limit) : vouchers;
    const nextCursor = hasNext ? items[items.length - 1]?.id : null;

    return {
      items,
      pagination: {
        hasNext,
        nextCursor,
        total: await this.prisma.voucher.count({ where }),
      },
    };
  }

  /**
   * Chi tiết voucher + thống kê sử dụng — Admin
   */
  async findOne(id: string) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, fullName: true, email: true } },
        _count: { select: { userVouchers: true, orders: true } },
      },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher không tồn tại');
    }

    return voucher;
  }

  /**
   * Cập nhật voucher — Admin (bật/tắt, sửa ngày, giới hạn)
   */
  async update(id: string, dto: UpdateVoucherDto) {
    await this.findOne(id); // Check tồn tại

    return this.prisma.voucher.update({
      where: { id },
      data: {
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.minOrderValue !== undefined && {
          minOrderValue: dto.minOrderValue,
        }),
        ...(dto.maxDiscount !== undefined && { maxDiscount: dto.maxDiscount }),
        ...(dto.usageLimit !== undefined && { usageLimit: dto.usageLimit }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  /**
   * Soft delete — set is_active = false (Admin)
   */
  async softDelete(id: string) {
    await this.findOne(id);

    return this.prisma.voucher.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  /**
   * Lấy danh sách voucher đang active (Public)
   */
  async findActivePublic() {
    return this.prisma.voucher.findMany({
      where: {
        isActive: true,
        endDate: { gt: new Date() },
      },
      orderBy: { endDate: 'asc' },
    });
  }

  /**
   * Lấy danh sách voucher user đã lưu (Customer)
   */
  async findMyVouchers(userId: string) {
    return this.prisma.userVoucher.findMany({
      where: { userId },
      include: {
        voucher: true,
      },
      orderBy: { claimedAt: 'desc' },
    });
  }

  /**
   * Lưu mã giảm giá vào ví (Customer)
   */
  async collectVoucher(userId: string, voucherId: string) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { id: voucherId },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher không tồn tại');
    }

    if (!voucher.isActive || new Date() > voucher.endDate) {
      throw new BadRequestException('Voucher đã hết hạn hoặc không hoạt động');
    }

    const existing = await this.prisma.userVoucher.findUnique({
      where: {
        userId_voucherId: { userId, voucherId },
      },
    });

    if (existing) {
      throw new ConflictException('Bạn đã lưu voucher này rồi');
    }

    return this.prisma.userVoucher.create({
      data: {
        userId,
        voucherId,
      },
      include: {
        voucher: true,
      },
    });
  }

  /**
   * Kiểm tra voucher hợp lệ — dùng cho checkout preview
   */
  async checkVoucher(code: string, userId?: string) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!voucher) {
      throw new NotFoundException('Mã voucher không hợp lệ');
    }

    const now = new Date();

    if (!voucher.isActive) {
      throw new BadRequestException('Mã voucher đã bị vô hiệu hóa');
    }

    if (now < voucher.startDate || now > voucher.endDate) {
      throw new BadRequestException('Mã voucher đã hết hạn');
    }

    if (
      voucher.usageLimit !== null &&
      voucher.usedCount >= voucher.usageLimit
    ) {
      throw new BadRequestException('Mã voucher đã hết lượt sử dụng');
    }

    // Check VIP tier
    if (voucher.vipOnly && userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { vipTier: true },
      });
      if (!user || user.vipTier !== voucher.vipOnly) {
        throw new BadRequestException(
          `Mã này chỉ dành cho VIP ${voucher.vipOnly}`,
        );
      }
    }

    // Check user đã dùng chưa
    if (userId) {
      const used = await this.prisma.userVoucher.findUnique({
        where: {
          userId_voucherId: { userId, voucherId: voucher.id },
        },
      });
      if (used?.isUsed) {
        throw new BadRequestException('Bạn đã sử dụng mã voucher này');
      }
    }

    return {
      id: voucher.id,
      code: voucher.code,
      type: voucher.type,
      value: Number(voucher.value),
      minOrderValue: Number(voucher.minOrderValue),
      maxDiscount: voucher.maxDiscount ? Number(voucher.maxDiscount) : null,
    };
  }

  // ===========================================================================
  // CRON JOBS
  // ===========================================================================

  /**
   * Auto-expire voucher hết hạn — chạy mỗi giờ
   */
  @Cron(CronExpression.EVERY_HOUR)
  async autoExpireVouchers() {
    const result = await this.prisma.voucher.updateMany({
      where: {
        endDate: { lt: new Date() },
        isActive: true,
      },
      data: { isActive: false },
    });

    if (result.count > 0) {
      this.logger.log(`⏰ Auto-expire: ${result.count} voucher đã hết hạn`);
    }
  }
}
