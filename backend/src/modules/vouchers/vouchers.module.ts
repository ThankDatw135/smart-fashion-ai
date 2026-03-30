import { Module } from '@nestjs/common';
import { VouchersController } from './vouchers.controller.js';
import { VouchersService } from './vouchers.service.js';

/**
 * Vouchers Module — Admin CRUD + Public check + Cron auto-expire
 */
@Module({
  controllers: [VouchersController],
  providers: [VouchersService],
  exports: [VouchersService],
})
export class VouchersModule {}
