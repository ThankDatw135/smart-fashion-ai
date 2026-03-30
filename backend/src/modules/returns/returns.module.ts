import { Module } from '@nestjs/common';
import { ReturnsController, AdminReturnsController } from './returns.controller.js';
import { ReturnsService } from './returns.service.js';

/**
 * Returns Module — Đổi/trả hàng
 */
@Module({
  controllers: [ReturnsController, AdminReturnsController],
  providers: [ReturnsService],
  exports: [ReturnsService],
})
export class ReturnsModule {}
