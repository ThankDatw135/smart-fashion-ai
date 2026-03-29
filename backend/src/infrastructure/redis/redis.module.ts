import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service.js';

/**
 * Redis Module — Global để mọi feature module đều dùng được
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
