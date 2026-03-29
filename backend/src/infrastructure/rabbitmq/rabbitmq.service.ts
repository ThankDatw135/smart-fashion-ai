import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const amqplib = require('amqplib');

/**
 * RabbitMQ Service — publisher/consumer cho giao tiếp Backend ↔ AI Service
 * Sử dụng topic exchange cho event routing linh hoạt
 *
 * Ghi chú: Dùng require() vì amqplib v1 ESM types không tương thích Prisma.
 */
@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitmqService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private connection: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private channel: any = null;
  private readonly url: string;
  private readonly queuePrefix: string;

  constructor(private readonly configService: ConfigService) {
    this.url = this.configService.get<string>(
      'rabbitmq.url',
      'amqp://smartfashion:smartfashion_secret@localhost:5672',
    );
    this.queuePrefix = this.configService.get<string>('rabbitmq.queuePrefix', 'sf');
  }

  async onModuleInit() {
    try {
      this.connection = await amqplib.connect(this.url);
      this.channel = await this.connection.createChannel();
      this.logger.log('✅ Kết nối RabbitMQ thành công');
    } catch (error) {
      // RabbitMQ không bắt buộc cho dev — graceful degradation
      this.logger.warn(
        `⚠️ Không thể kết nối RabbitMQ: ${(error as Error).message}. Tính năng async sẽ bị vô hiệu hóa.`,
      );
    }
  }

  /**
   * Publish event lên exchange — AI Service sẽ consume
   * Nếu RabbitMQ không available → log warning, không throw
   */
  async publish(exchange: string, routingKey: string, data: unknown): Promise<void> {
    if (!this.channel) {
      this.logger.warn(`⚠️ RabbitMQ chưa kết nối. Bỏ qua event: ${routingKey}`);
      return;
    }

    try {
      await this.channel.assertExchange(exchange, 'topic', { durable: true });
      this.channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(data)),
        { persistent: true },
      );
      this.logger.debug(`📤 Published: ${exchange}/${routingKey}`);
    } catch (error) {
      this.logger.error(`❌ Publish failed: ${(error as Error).message}`);
    }
  }

  /**
   * Subscribe vào queue — lắng nghe event từ exchange
   */
  async subscribe(
    exchange: string,
    routingKey: string,
    queueName: string,
    handler: (data: unknown) => Promise<void>,
  ): Promise<void> {
    if (!this.channel) {
      this.logger.warn(`⚠️ RabbitMQ chưa kết nối. Không thể subscribe: ${queueName}`);
      return;
    }

    try {
      const fullQueueName = `${this.queuePrefix}.${queueName}`;
      await this.channel.assertExchange(exchange, 'topic', { durable: true });
      await this.channel.assertQueue(fullQueueName, { durable: true });
      await this.channel.bindQueue(fullQueueName, exchange, routingKey);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await this.channel.consume(fullQueueName, async (msg: any) => {
        if (!msg) return;

        try {
          const data = JSON.parse(msg.content.toString()) as unknown;
          await handler(data);
          this.channel.ack(msg);
        } catch (error) {
          this.logger.error(`❌ Consumer error: ${(error as Error).message}`);
          // Nack + không requeue → gửi vào DLQ (Dead Letter Queue)
          this.channel.nack(msg, false, false);
        }
      });

      this.logger.log(`📥 Subscribed: ${fullQueueName} ← ${exchange}/${routingKey}`);
    } catch (error) {
      this.logger.error(`❌ Subscribe failed: ${(error as Error).message}`);
    }
  }

  /** Kiểm tra kết nối RabbitMQ */
  isConnected(): boolean {
    return this.channel !== null;
  }

  async onModuleDestroy() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      this.logger.log('🔌 Ngắt kết nối RabbitMQ');
    } catch {
      // Bỏ qua lỗi khi đóng — có thể đã đóng rồi
    }
  }
}
