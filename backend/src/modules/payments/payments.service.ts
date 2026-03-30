import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RabbitmqService } from '../../infrastructure/rabbitmq/rabbitmq.service.js';
import {
  PAYMENT_INVALID_SIGNATURE,
  PAYMENT_ALREADY_PROCESSED,
  ORDER_NOT_FOUND,
} from '../../common/constants/error-codes.js';
import { MomoIpnDto } from './dto/index.js';

// Ghi chú: Thông tin ngân hàng hiển thị cho khách chuyển khoản
const BANK_INFO = {
  bankName: 'Vietcombank',
  accountNumber: '1234567890',
  accountHolder: 'SMART FASHION AI',
};

/**
 * Payments Service — xử lý thanh toán
 * - COD: đơn giản nhất (xác nhận khi giao)
 * - MoMo: tạo payment request + verify IPN webhook
 * - Bank Transfer: hiển thị thông tin CK, Admin xác nhận
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly rabbitmq: RabbitmqService,
  ) {}

  // ===========================================================================
  // MoMo INTEGRATION
  // ===========================================================================

  /**
   * Tạo MoMo payment request URL
   * Trả payUrl để frontend redirect sang MoMo
   */
  async createMomoPayment(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    if (!order) throw new NotFoundException(ORDER_NOT_FOUND);

    const partnerCode = this.configService.get<string>(
      'payment.momo.partnerCode',
      '',
    );
    const accessKey = this.configService.get<string>(
      'payment.momo.accessKey',
      '',
    );
    const secretKey = this.configService.get<string>(
      'payment.momo.secretKey',
      '',
    );
    const redirectUrl = this.configService.get<string>(
      'payment.momo.redirectUrl',
      'http://localhost:3000/payment/result',
    );
    const ipnUrl = this.configService.get<string>(
      'payment.momo.ipnUrl',
      'http://localhost:3001/api/v1/payments/momo/ipn',
    );

    const requestId = `${partnerCode}-${Date.now()}`;
    const amount = Number(order.total);
    const orderInfo = `Thanh toán đơn hàng ${order.orderNumber}`;
    const extraData = '';

    // Tạo signature HMAC-SHA256
    const rawSignature = [
      `accessKey=${accessKey}`,
      `amount=${amount}`,
      `extraData=${extraData}`,
      `ipnUrl=${ipnUrl}`,
      `orderId=${order.orderNumber}`,
      `orderInfo=${orderInfo}`,
      `partnerCode=${partnerCode}`,
      `redirectUrl=${redirectUrl}`,
      `requestId=${requestId}`,
      `requestType=payWithMethod`,
    ].join('&');

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode,
      partnerName: 'Smart Fashion AI',
      storeId: 'SmartFashionStore',
      requestId,
      amount,
      orderId: order.orderNumber,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang: 'vi',
      requestType: 'payWithMethod',
      autoCapture: true,
      extraData,
      signature,
    };

    // Ghi chú: Trong production, gọi MoMo API thực tế
    // const response = await fetch('https://test-payment.momo.vn/v2/gateway/api/create', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(requestBody),
    // });

    this.logger.log(
      `MoMo payment request tạo cho đơn: ${order.orderNumber}`,
    );

    return {
      requestBody,
      // payUrl sẽ lấy từ MoMo response thực tế
      payUrl: `https://test-payment.momo.vn/pay?orderId=${order.orderNumber}`,
      message:
        'Vui lòng redirect đến payUrl. Trong dev mode, MoMo API chưa kết nối thật.',
    };
  }

  /**
   * Xử lý MoMo IPN callback
   * MoMo gửi POST request đến endpoint này sau khi user thanh toán
   */
  async handleMomoIpn(dto: MomoIpnDto) {
    // 1. Verify signature
    const secretKey = this.configService.get<string>(
      'payment.momo.secretKey',
      '',
    );
    const accessKey = this.configService.get<string>(
      'payment.momo.accessKey',
      '',
    );

    const rawSignature = [
      `accessKey=${accessKey}`,
      `amount=${dto.amount}`,
      `extraData=${dto.extraData}`,
      `message=${dto.message}`,
      `orderId=${dto.orderId}`,
      `orderInfo=${dto.orderInfo}`,
      `orderType=${dto.orderType}`,
      `partnerCode=${dto.partnerCode}`,
      `payType=${dto.payType}`,
      `requestId=${dto.requestId}`,
      `responseTime=${dto.responseTime}`,
      `resultCode=${dto.resultCode}`,
      `transId=${dto.transId}`,
    ].join('&');

    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    if (dto.signature !== expectedSignature) {
      this.logger.error(`MoMo IPN invalid signature: ${dto.orderId}`);
      throw new BadRequestException(PAYMENT_INVALID_SIGNATURE);
    }

    // 2. Tìm order theo orderNumber
    const order = await this.prisma.order.findUnique({
      where: { orderNumber: dto.orderId },
      include: { payment: true },
    });
    if (!order) {
      this.logger.error(`MoMo IPN order not found: ${dto.orderId}`);
      throw new NotFoundException(ORDER_NOT_FOUND);
    }

    // 3. Kiểm tra đã xử lý chưa
    if (
      order.payment &&
      order.payment.status !== 'pending'
    ) {
      this.logger.warn(`MoMo IPN already processed: ${dto.orderId}`);
      throw new BadRequestException(PAYMENT_ALREADY_PROCESSED);
    }

    // 4. Xử lý theo resultCode
    if (dto.resultCode === 0) {
      // Thanh toán thành công
      await this.prisma.$transaction(async (tx) => {
        // Update payment
        await tx.payment.updateMany({
          where: { orderId: order.id },
          data: {
            status: 'success',
            transactionId: String(dto.transId),
            paidAt: new Date(),
          },
        });
        // Update order status → confirmed
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'confirmed' },
        });
        // Log status history
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: 'confirmed',
            note: `MoMo thanh toán thành công (transId: ${dto.transId})`,
            changedBy: order.userId,
          },
        });
      });

      this.logger.log(`✅ MoMo IPN success: ${dto.orderId}`);
    } else {
      // Thanh toán thất bại → rollback stock
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.updateMany({
          where: { orderId: order.id },
          data: { status: 'failed' },
        });

        // Revert stock
        const items = await tx.orderItem.findMany({
          where: { orderId: order.id },
        });
        for (const item of items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }

        await tx.order.update({
          where: { id: order.id },
          data: { status: 'cancelled', cancelReason: `MoMo failed: ${dto.message}` },
        });
      });

      this.logger.warn(`❌ MoMo IPN failed: ${dto.orderId} — ${dto.message}`);
    }

    return { resultCode: 0, message: 'IPN received' };
  }

  // ===========================================================================
  // BANK TRANSFER — Admin xác nhận
  // ===========================================================================

  /**
   * Lấy thông tin chuyển khoản cho 1 đơn hàng
   */
  async getBankTransferInfo(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { orderNumber: true, total: true },
    });
    if (!order) throw new NotFoundException(ORDER_NOT_FOUND);

    return {
      bank: BANK_INFO,
      transferContent: order.orderNumber,
      amount: Number(order.total),
      note: `Nội dung chuyển khoản: ${order.orderNumber}`,
    };
  }

  /**
   * Admin xác nhận đã nhận chuyển khoản
   */
  async confirmBankTransfer(
    orderId: string,
    adminId: string,
    note?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    if (!order) throw new NotFoundException(ORDER_NOT_FOUND);

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.updateMany({
        where: { orderId: order.id },
        data: {
          status: 'success',
          paidAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { status: 'confirmed' },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'confirmed',
          note: note || 'Admin xác nhận chuyển khoản thành công',
          changedBy: adminId,
        },
      });
    });

    this.logger.log(
      `✅ Bank Transfer confirmed: ${order.orderNumber} by admin:${adminId}`,
    );

    return { message: 'Xác nhận chuyển khoản thành công' };
  }
}
