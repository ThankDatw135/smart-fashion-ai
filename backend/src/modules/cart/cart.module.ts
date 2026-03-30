import { Module } from '@nestjs/common';
import { CartController } from './cart.controller.js';
import { CartService } from './cart.service.js';

/**
 * Cart Module — giỏ hàng (Guest Redis + User DB)
 * PrismaModule, RedisModule đã Global → không cần import
 */
@Module({
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
