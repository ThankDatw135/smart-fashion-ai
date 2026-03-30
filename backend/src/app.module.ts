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
