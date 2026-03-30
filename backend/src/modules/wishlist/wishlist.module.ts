import { Module } from '@nestjs/common';
import { WishlistController } from './wishlist.controller.js';
import { WishlistService } from './wishlist.service.js';

/**
 * Wishlist Module — Danh sách yêu thích
 */
@Module({
  controllers: [WishlistController],
  providers: [WishlistService],
  exports: [WishlistService],
})
export class WishlistModule {}
