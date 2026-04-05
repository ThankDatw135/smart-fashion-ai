import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  ReturnsController,
  AdminReturnsController,
} from './returns.controller.js';
import { ReturnsService } from './returns.service.js';
import { QUEUE_NAMES } from '../../common/constants/queue-names.js';

/**
 * Returns Module — Đổi/trả hàng
 */
@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_NAMES.MAIL })],
  controllers: [ReturnsController, AdminReturnsController],
  providers: [ReturnsService],
  exports: [ReturnsService],
})
export class ReturnsModule {}
