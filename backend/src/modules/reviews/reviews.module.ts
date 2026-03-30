import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReviewsController } from './reviews.controller.js';
import { ReviewsService } from './reviews.service.js';
import { QUEUE_NAMES } from '../../common/constants/queue-names.js';

/**
 * Reviews Module — Đánh giá sản phẩm
 * Sử dụng BullMQ để async update avgRating
 */
@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_NAMES.MAIL })],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
