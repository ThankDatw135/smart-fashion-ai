import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';

/**
 * Bootstrap — khởi tạo NestJS server
 * Cấu hình: CORS, Helmet, Validation, Versioning, Swagger
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // --- Lấy config ---
  const port = configService.get<number>('app.port', 4000);
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');
  const frontendUrl = configService.get<string>(
    'app.frontendUrl',
    'http://localhost:3000',
  );

  // --- Security Headers ---
  app.use(helmet());

  // --- Cookie Parser (cho refresh token HTTP-Only cookie) ---
  app.use(cookieParser());

  // --- Static Files ---
  app.useStaticAssets(join(process.cwd(), '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // --- CORS — chỉ cho phép frontend origin ---
  app.enableCors({
    origin: frontendUrl,
    credentials: true, // Cho phép gửi cookie
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Guest-Id'],
  });

  // --- API Prefix: /api ---
  app.setGlobalPrefix(apiPrefix);

  // --- API Versioning: /api/v1/ ---
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // --- Global Validation Pipe ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Loại bỏ field không khai báo trong DTO
      forbidNonWhitelisted: true, // Throw lỗi nếu gửi field lạ
      transform: true, // Tự động chuyển đổi type (string → number)
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // --- Swagger / OpenAPI Documentation ---
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Smart Fashion AI — API')
    .setDescription(
      'REST API cho website bán quần áo tích hợp AI. ' +
        'Hỗ trợ: Auth, Products, Cart, Checkout, Orders, VIP, Reviews, Blog, Notifications.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-Auth',
    )
    .addCookieAuth('refreshToken')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // --- Khởi chạy server ---
  await app.listen(port);
  logger.log(`🚀 Server đang chạy tại http://localhost:${port}`);
  logger.log(`📖 Swagger UI: http://localhost:${port}/${apiPrefix}/docs`);
  logger.log(
    `💚 Health check: http://localhost:${port}/${apiPrefix}/v1/health`,
  );
}

bootstrap();
