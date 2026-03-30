import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  ReturnType as PrismaReturnType,
  ReturnStatus as PrismaReturnStatus,
  OrderStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { QUEUE_NAMES } from '../../common/constants/queue-names.js';
import { CreateReturnDto, ProcessReturnDto } from './dto/index.js';

/**
 * Returns Service — Đổi/trả hàng
 * - User tạo yêu cầu return/exchange (đơn đã completed)
 * - Admin duyệt/từ chối
 * - Admin hoàn tất: restore stock khi completed
 * - Notify user mỗi bước
 */
@Injectable()
export class ReturnsService {
  private readonly logger = new Logger(ReturnsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.MAIL) private readonly mailQueue: Queue,
  ) {}

  // ===========================================================================
  // USER — TẠO YÊU CẦU ĐỔI/TRẢ
  // ===========================================================================

  /**
   * User tạo yêu cầu đổi/trả hàng
   * Điều kiện: order phải ở trạng thái `completed`
   */
  async createReturn(userId: string, dto: CreateReturnDto) {
    // 1. Kiểm tra đơn hàng
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        returnRequest: true,
        items: {
          include: {
            variant: {
              include: { product: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    // Chỉ chủ đơn mới được tạo return
    if (order.userId !== userId) {
      throw new BadRequestException('Bạn không có quyền với đơn hàng này');
    }

    // Chỉ đơn completed mới được đổi/trả
    if (order.status !== OrderStatus.completed) {
      throw new BadRequestException(
        'Chỉ đơn hàng đã hoàn thành mới có thể đổi/trả',
      );
    }

    // Kiểm tra đã có return request chưa (1 đơn = 1 return)
    if (order.returnRequest) {
      throw new ConflictException('Đơn hàng này đã có yêu cầu đổi/trả');
    }

    // 2. Tạo return request
    const returnRequest = await this.prisma.returnRequest.create({
      data: {
        orderId: dto.orderId,
        userId,
        type: dto.type as PrismaReturnType,
        reason: dto.reason,
        status: PrismaReturnStatus.pending,
      },
      include: {
        order: { select: { orderNumber: true } },
      },
    });

    // 3. Notify admin
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['admin', 'super_admin'] }, isActive: true },
      select: { id: true },
    });

    const typeLabel = dto.type === 'return_item' ? 'Trả hàng' : 'Đổi hàng';

    if (admins.length > 0) {
      await this.prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: 'system' as const,
          title: `📦 Yêu cầu ${typeLabel}: ${returnRequest.order.orderNumber}`,
          message: `Lý do: ${dto.reason.slice(0, 100)}`,
          data: { returnId: returnRequest.id, orderId: dto.orderId },
          channel: 'in_app' as const,
        })),
      });
    }

    this.logger.log(
      `Return request tạo mới: ${returnRequest.id} [${typeLabel}] cho đơn ${returnRequest.order.orderNumber}`,
    );

    return returnRequest;
  }

  // ===========================================================================
  // USER — XEM DANH SÁCH YÊU CẦU
  // ===========================================================================

  /**
   * User xem danh sách yêu cầu đổi/trả của mình
   */
  async findUserReturns(userId: string) {
    return this.prisma.returnRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            orderNumber: true,
            total: true,
            items: {
              take: 3,
              include: {
                variant: {
                  include: { product: { select: { name: true } } },
                },
              },
            },
          },
        },
      },
    });
  }

  // ===========================================================================
  // ADMIN — QUẢN LÝ YÊU CẦU ĐỔI/TRẢ
  // ===========================================================================

  /**
   * Admin danh sách tất cả return requests
   */
  async findAllAdmin(params: {
    status?: string;
    cursor?: string;
    limit?: number;
  }) {
    const { status, cursor, limit = 20 } = params;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const requests = await this.prisma.returnRequest.findMany({
      where,
      take: limit + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        order: { select: { orderNumber: true, total: true } },
        processor: { select: { fullName: true } },
      },
    });

    const hasNext = requests.length > limit;
    const items = hasNext ? requests.slice(0, limit) : requests;
    const nextCursor = hasNext ? items[items.length - 1]?.id : null;

    return {
      items,
      pagination: {
        hasNext,
        nextCursor,
        total: await this.prisma.returnRequest.count({ where }),
      },
    };
  }

  /**
   * Admin chi tiết return request
   */
  async findOneAdmin(id: string) {
    const request = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        order: {
          include: {
            items: {
              include: {
                variant: {
                  include: { product: { select: { name: true } } },
                },
              },
            },
          },
        },
        processor: { select: { fullName: true } },
      },
    });

    if (!request) {
      throw new NotFoundException('Yêu cầu đổi/trả không tồn tại');
    }

    return request;
  }

  /**
   * Admin duyệt/từ chối yêu cầu
   */
  async processReturn(id: string, adminId: string, dto: ProcessReturnDto) {
    const request = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        order: { select: { orderNumber: true } },
      },
    });

    if (!request) {
      throw new NotFoundException('Yêu cầu đổi/trả không tồn tại');
    }

    if (request.status !== PrismaReturnStatus.pending) {
      throw new BadRequestException('Yêu cầu này đã được xử lý');
    }

    const newStatus = dto.decision === 'approved'
      ? PrismaReturnStatus.approved
      : PrismaReturnStatus.rejected;

    const updated = await this.prisma.returnRequest.update({
      where: { id },
      data: {
        status: newStatus,
        adminNote: dto.adminNote ?? null,
        refundAmount: dto.decision === 'approved'
          ? (dto.refundAmount ?? null)
          : null,
        processedBy: adminId,
      },
    });

    // Notify user
    const statusText = dto.decision === 'approved' ? '✅ Đã duyệt' : '❌ Bị từ chối';

    await this.prisma.notification.create({
      data: {
        userId: request.userId,
        type: 'system',
        title: `${statusText}: Yêu cầu đổi/trả #${request.order.orderNumber}`,
        message: dto.adminNote || `Yêu cầu đổi/trả của bạn đã ${dto.decision === 'approved' ? 'được duyệt' : 'bị từ chối'}`,
        data: { returnId: id, decision: dto.decision },
        channel: 'in_app',
      },
    });

    // Gửi email thông báo
    await this.mailQueue.add('send-return-processed', {
      email: request.user.email,
      fullName: request.user.fullName,
      orderNumber: request.order.orderNumber,
      decision: dto.decision,
      adminNote: dto.adminNote ?? '',
      refundAmount: dto.refundAmount ?? 0,
    });

    this.logger.log(
      `Return ${id} processed: ${dto.decision} by admin ${adminId}`,
    );

    return updated;
  }

  /**
   * Admin hoàn tất return → restore stock (nếu return_item)
   */
  async completeReturn(id: string, adminId: string) {
    const request = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: { select: { variantId: true, quantity: true } },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Yêu cầu đổi/trả không tồn tại');
    }

    if (request.status !== PrismaReturnStatus.approved) {
      throw new BadRequestException('Chỉ yêu cầu đã duyệt mới có thể hoàn tất');
    }

    // Transaction: update status + restore stock
    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Update return status → completed
      const result = await tx.returnRequest.update({
        where: { id },
        data: {
          status: PrismaReturnStatus.completed,
          processedBy: adminId,
        },
      });

      // 2. Restore stock nếu là trả hàng (return_item)
      if (request.type === 'return_item') {
        for (const item of request.order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }

        this.logger.log(
          `Đã restore stock cho ${request.order.items.length} items`,
        );
      }

      return result;
    });

    // Notify user hoàn tất
    await this.prisma.notification.create({
      data: {
        userId: request.userId,
        type: 'system',
        title: '✅ Yêu cầu đổi/trả đã hoàn tất',
        message: request.refundAmount
          ? `Số tiền hoàn: ${Number(request.refundAmount).toLocaleString('vi-VN')}đ`
          : 'Yêu cầu đổi/trả hàng đã được xử lý xong',
        data: { returnId: id },
        channel: 'in_app',
      },
    });

    this.logger.log(`Return ${id} completed by admin ${adminId}`);

    return updated;
  }
}
