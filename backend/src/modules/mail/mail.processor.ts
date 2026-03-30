import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { QUEUE_NAMES } from '../../common/constants/queue-names.js';
import { PrismaService } from '../../prisma/prisma.service.js';

/**
 * Mail Processor — BullMQ worker xử lý gửi email
 * Đọc template Handlebars → compile → gửi qua SMTP
 */
@Processor(QUEUE_NAMES.MAIL)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly templates = new Map<string, Handlebars.TemplateDelegate>();

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super();

    // Khởi tạo Nodemailer SMTP transporter
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('mail.host', 'smtp.gmail.com'),
      port: this.configService.get<number>('mail.port', 587),
      secure: false,
      auth: {
        user: this.configService.get<string>('mail.user', ''),
        pass: this.configService.get<string>('mail.password', ''),
      },
    });

    // Pre-compile tất cả templates
    this.loadTemplates();
  }

  /**
   * Xử lý từng job trong queue mail
   */
  async process(job: Job): Promise<void> {
    const { name, data } = job;
    this.logger.log(`Đang xử lý mail job: ${name} → ${data.email}`);

    try {
      switch (name) {
        case 'send-otp-verify-email':
          await this.sendOtpEmail(data.email, data.otp, 'verify-email');
          break;

        case 'send-otp-reset-password':
          await this.sendOtpEmail(data.email, data.otp, 'reset-password');
          break;

        case 'send-welcome':
          await this.sendWelcomeEmail(data.email);
          break;

        case 'send-order-confirmation':
          await this.sendOrderConfirmationEmail(data);
          break;

        case 'send-low-stock-alert':
          await this.sendLowStockAlertEmail(data);
          break;

        case 'send-vip-upgrade':
          await this.sendVipUpgradeEmail(data);
          break;

        case 'update-product-rating':
          await this.updateProductRating(data.productId as string);
          break;

        case 'send-return-processed':
          await this.sendReturnProcessedEmail(data);
          break;

        default:
          this.logger.warn(`Job mail không xác định: ${name}`);
      }
    } catch (error) {
      this.logger.error(`Lỗi gửi mail: ${name} → ${data.email}`, (error as Error).stack);
      throw error; // Retry theo cấu hình BullMQ
    }
  }

  /**
   * Gửi email OTP (xác minh email hoặc reset password)
   */
  private async sendOtpEmail(
    email: string,
    otp: string,
    type: 'verify-email' | 'reset-password',
  ) {
    const templateName = type === 'verify-email' ? 'verify-email' : 'reset-password';
    const subject = type === 'verify-email'
      ? '🔐 Xác minh email — Smart Fashion AI'
      : '🔒 Đặt lại mật khẩu — Smart Fashion AI';

    const template = this.templates.get(templateName);
    if (!template) {
      this.logger.error(`Template không tìm thấy: ${templateName}`);
      return;
    }

    const html = template({
      email,
      otp,
      fullName: email.split('@')[0], // Tạm dùng phần trước @ nếu không có tên
    });

    await this.transporter.sendMail({
      from: this.configService.get<string>('mail.from', 'noreply@smartfashion.vn'),
      to: email,
      subject,
      html,
    });

    this.logger.log(`✅ Email OTP (${type}) đã gửi: ${email}`);
  }

  /**
   * Gửi email chào mừng
   */
  private async sendWelcomeEmail(email: string) {
    const template = this.templates.get('welcome');
    if (!template) {
      this.logger.error('Template welcome không tìm thấy');
      return;
    }

    const frontendUrl = this.configService.get<string>('app.frontendUrl', 'http://localhost:3000');

    const html = template({
      fullName: email.split('@')[0],
      frontendUrl,
    });

    await this.transporter.sendMail({
      from: this.configService.get<string>('mail.from', 'noreply@smartfashion.vn'),
      to: email,
      subject: '🎉 Chào mừng bạn đến với Smart Fashion AI!',
      html,
    });

    this.logger.log(`✅ Email chào mừng đã gửi: ${email}`);
  }

  /**
   * Gửi email xác nhận đơn hàng
   */
  private async sendOrderConfirmationEmail(data: {
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
    const template = this.templates.get('order-confirmation');
    if (!template) {
      this.logger.error('Template order-confirmation không tìm thấy');
      return;
    }

    const frontendUrl = this.configService.get<string>(
      'app.frontendUrl',
      'http://localhost:3000',
    );

    const html = template({ ...data, frontendUrl });

    await this.transporter.sendMail({
      from: this.configService.get<string>(
        'mail.from',
        'noreply@smartfashion.vn',
      ),
      to: data.email,
      subject: `✅ Xác nhận đơn hàng ${data.orderNumber} — Smart Fashion AI`,
      html,
    });

    this.logger.log(
      `✅ Email xác nhận đơn hàng đã gửi: ${data.email} (${data.orderNumber})`,
    );
  }

  /**
   * Gửi email cảnh báo tồn kho thấp cho Admin
   */
  private async sendLowStockAlertEmail(data: {
    email: string;
    totalVariants: number;
    variants: Array<{
      productName: string;
      size: string;
      color: string;
      stockQuantity: number;
    }>;
  }) {
    const template = this.templates.get('low-stock-alert');
    if (!template) {
      this.logger.error('Template low-stock-alert không tìm thấy');
      return;
    }

    const adminUrl = this.configService.get<string>(
      'app.adminUrl',
      'http://localhost:3000/admin',
    );

    const html = template({
      ...data,
      adminUrl,
      timestamp: new Date().toLocaleString('vi-VN'),
    });

    await this.transporter.sendMail({
      from: this.configService.get<string>(
        'mail.from',
        'noreply@smartfashion.vn',
      ),
      to: data.email,
      subject: `⚠️ Cảnh báo tồn kho thấp — ${data.totalVariants} sản phẩm`,
      html,
    });

    this.logger.log(
      `✅ Email cảnh báo tồn kho đã gửi: ${data.email} (${data.totalVariants} variants)`,
    );
  }

  /**
   * Load và compile tất cả Handlebars templates từ thư mục templates/
   */
  private loadTemplates() {
    const templatesDir = path.resolve(__dirname, '..', '..', 'templates');
    const templateFiles = [
      'verify-email',
      'welcome',
      'reset-password',
      'order-confirmation',
      'low-stock-alert',
      'vip-upgrade',
      'return-processed',
    ];

    for (const name of templateFiles) {
      const filePath = path.join(templatesDir, `${name}.hbs`);
      try {
        if (fs.existsSync(filePath)) {
          const source = fs.readFileSync(filePath, 'utf-8');
          this.templates.set(name, Handlebars.compile(source));
          this.logger.log(`Template loaded: ${name}`);
        } else {
          this.logger.warn(`Template file không tồn tại: ${filePath}`);
        }
      } catch (error) {
        this.logger.error(
          `Lỗi load template ${name}:`,
          (error as Error).message,
        );
      }
    }
  }

  /**
   * Gửi email chúc mừng lên VIP
   */
  private async sendVipUpgradeEmail(data: {
    email: string;
    fullName: string;
    tierLabel: string;
    percent: number;
    maxDiscount: string;
  }) {
    const template = this.templates.get('vip-upgrade');
    if (!template) {
      this.logger.error('Template vip-upgrade không tìm thấy');
      return;
    }

    const html = template(data);

    await this.transporter.sendMail({
      from: this.configService.get<string>(
        'mail.from',
        'noreply@smartfashion.vn',
      ),
      to: data.email,
      subject: `🎉 Chúc mừng bạn lên VIP ${data.tierLabel}!`,
      html,
    });

    this.logger.log(
      `✅ Email VIP upgrade đã gửi: ${data.email} → ${data.tierLabel}`,
    );
  }

  /**
   * Update avgRating + reviewCount cho sản phẩm
   * Gọi từ Reviews Service qua BullMQ
   */
  private async updateProductRating(productId: string) {
    const stats = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        avgRating: stats._avg.rating ?? 0,
        reviewCount: stats._count.rating,
      },
    });

    this.logger.log(
      `⭐ Rating updated: productId=${productId}, avg=${stats._avg.rating}, count=${stats._count.rating}`,
    );
  }

  /**
   * Gửi email thông báo kết quả xử lý đổi/trả hàng
   */
  private async sendReturnProcessedEmail(data: {
    email: string;
    fullName: string;
    orderNumber: string;
    decision: 'approved' | 'rejected';
    adminNote: string;
    refundAmount: number;
  }) {
    const template = this.templates.get('return-processed');
    if (!template) {
      this.logger.warn('Template return-processed không tìm thấy, gửi email text');
      // Fallback: gửi email text thuần
      const statusText = data.decision === 'approved' ? 'ĐÃ DUYỆT' : 'BỊ TỪ CHỐI';
      await this.transporter.sendMail({
        from: this.configService.get<string>('mail.from', 'noreply@smartfashion.vn'),
        to: data.email,
        subject: `📦 Yêu cầu đổi/trả hàng ${statusText} — #${data.orderNumber}`,
        text: `Xin chào ${data.fullName},\n\nYêu cầu đổi/trả hàng cho đơn #${data.orderNumber} đã ${statusText}.\n${data.adminNote ? `Ghi chú: ${data.adminNote}` : ''}\n${data.refundAmount > 0 ? `Số tiền hoàn: ${data.refundAmount.toLocaleString('vi-VN')}đ` : ''}\n\nTrân trọng,\nSmart Fashion AI`,
      });
      return;
    }

    const html = template(data);
    const statusText = data.decision === 'approved' ? 'ĐÃ DUYỆT' : 'BỊ TỪ CHỐI';

    await this.transporter.sendMail({
      from: this.configService.get<string>('mail.from', 'noreply@smartfashion.vn'),
      to: data.email,
      subject: `📦 Yêu cầu đổi/trả hàng ${statusText} — #${data.orderNumber}`,
      html,
    });

    this.logger.log(`✅ Email return processed đã gửi: ${data.email} → ${data.decision}`);
  }
}
