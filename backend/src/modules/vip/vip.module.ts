import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { VipService } from './vip.service.js';
import { QUEUE_NAMES } from '../../common/constants/queue-names.js';

/**
 * VIP Module — Hệ thống VIP tự động
 * Export VipService để OrdersModule sử dụng khi order completed
 */
@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_NAMES.MAIL })],
  providers: [VipService],
  exports: [VipService],
})
export class VipModule {}
