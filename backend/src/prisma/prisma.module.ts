import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/**
 * Prisma Module — Global để tất cả module đều sử dụng được PrismaService
 * Không cần import lại ở mỗi feature module
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
