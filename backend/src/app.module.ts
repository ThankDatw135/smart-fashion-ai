import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

// Configs
import {
  appConfig,
  databaseConfig,
  redisConfig,
  jwtConfig,
  rabbitmqConfig,
  mailConfig,
  cloudinaryConfig,
  paymentConfig,
} from './config/index.js';

// Infrastructure
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './infrastructure/redis/redis.module.js';
import { RabbitmqModule } from './infrastructure/rabbitmq/rabbitmq.module.js';
import { BullConfigModule } from './infrastructure/bull/bull.module.js';

// Common
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';

// Feature Modules
import { HealthModule } from './modules/health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { MailModule } from './modules/mail/mail.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { ProductsModule } from './modules/products/products.module.js';
import { CartModule } from './modules/cart/cart.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { VipModule } from './modules/vip/vip.module.js';
import { VouchersModule } from './modules/vouchers/vouchers.module.js';
import { ReviewsModule } from './modules/reviews/reviews.module.js';
import { WishlistModule } from './modules/wishlist/wishlist.module.js';
import { BlogModule } from './modules/blog/blog.module.js';
import { BannersModule } from './modules/banners/banners.module.js';
import { ReturnsModule } from './modules/returns/returns.module.js';
import { AnalyticsModule } from './modules/analytics/analytics.module.js';

@Module({
  imports: [
    // === Cấu hình ===
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        jwtConfig,
        rabbitmqConfig,
        mailConfig,
        cloudinaryConfig,
        paymentConfig,
      ],
      envFilePath: '.env',
    }),

    // === Rate Limiting — 100 request/phút/IP ===
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
          limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
        },
      ],
    }),

    // === Cron Jobs ===
    ScheduleModule.forRoot(),

    // === Infrastructure (Global) ===
    PrismaModule,
    RedisModule,
    RabbitmqModule,
    BullConfigModule,

    // === Feature Modules ===
    HealthModule,
    AuthModule, // Phase 2: Xác thực & Phân quyền
    UsersModule, // Phase 2: Quản lý hồ sơ người dùng
    MailModule, // Phase 2: BullMQ mail processor
    CategoriesModule, // Phase 3: Danh mục sản phẩm
    ProductsModule, // Phase 3: Sản phẩm, variants, tags, upload ảnh
    CartModule, // Phase 4: Giỏ hàng (Guest Redis + User DB)
    OrdersModule, // Phase 4: Checkout flow + Quản lý đơn hàng
    PaymentsModule, // Phase 4: COD, MoMo, Chuyển khoản
    NotificationsModule, // Phase 4: Low stock alert + Admin notify
    VipModule, // Phase 5: Hệ thống VIP tự động
    VouchersModule, // Phase 5: Quản lý voucher (Admin CRUD + Public check)
    ReviewsModule, // Phase 5: Đánh giá sản phẩm
    WishlistModule, // Phase 5: Danh sách yêu thích
    BlogModule, // Phase 5: Hệ thống blog
    BannersModule, // Phase 5: Banner trang chủ
    ReturnsModule, // Phase 5: Đổi/trả hàng
    AnalyticsModule, // Phase 5: Admin Dashboard KPI
  ],
  providers: [
    // Throttler bảo vệ toàn bộ endpoints
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Exception filter RFC 7807
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    // Response wrapper { success, data, meta }
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    // Request/Response logging
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
