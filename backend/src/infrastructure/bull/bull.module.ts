import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { QUEUE_NAMES } from '../../common/constants/queue-names.js';

/**
 * Bull Module — cấu hình BullMQ queues cho async tasks
 * Sử dụng Redis làm backend, mỗi queue xử lý 1 loại job
 */
@Module({
  imports: [
    // Cấu hình kết nối Redis cho BullMQ
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host', 'localhost'),
          port: configService.get<number>('redis.port', 6379),
          password: configService.get<string>('redis.password') || undefined,
          db: configService.get<number>('redis.db', 0),
        },
      }),
    }),

    // Đăng ký các queues
    BullModule.registerQueue(
      { name: QUEUE_NAMES.MAIL },
      { name: QUEUE_NAMES.NOTIFICATION },
      { name: QUEUE_NAMES.PRODUCT_INDEX },
      { name: QUEUE_NAMES.ORDER_PROCESS },
      { name: QUEUE_NAMES.VOUCHER_EXPIRE },
      { name: QUEUE_NAMES.VIP_CALCULATE },
    ),
  ],
  exports: [BullModule],
})
export class BullConfigModule {}
