import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../../common/constants/queue-names.js';
import {
  CheckoutController,
  UserOrdersController,
  AdminOrdersController,
} from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { VipModule } from '../vip/vip.module.js';

/**
 * Orders Module — checkout flow + quản lý đơn hàng
 * Import NotificationsModule, VipModule
 */
@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUEUE_NAMES.MAIL },
      { name: QUEUE_NAMES.ORDER_PROCESS },
    ),
    NotificationsModule,
    VipModule,
  ],
  controllers: [
    CheckoutController,
    UserOrdersController,
    AdminOrdersController,
  ],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
