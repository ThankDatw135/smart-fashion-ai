import { Module } from '@nestjs/common';
import {
  AdminBannersController,
  PublicBannersController,
} from './banners.controller.js';
import { BannersService } from './banners.service.js';

/**
 * Banners Module — Quản lý banner trang chủ
 */
@Module({
  controllers: [AdminBannersController, PublicBannersController],
  providers: [BannersService],
  exports: [BannersService],
})
export class BannersModule {}
