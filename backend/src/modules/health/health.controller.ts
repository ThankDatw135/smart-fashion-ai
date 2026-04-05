import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../infrastructure/redis/redis.service.js';
import { RabbitmqService } from '../../infrastructure/rabbitmq/rabbitmq.service.js';

/**
 * Health Controller — kiểm tra trạng thái tất cả services
 * Dùng cho monitoring, load balancer health check, DevOps alerts
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly rabbitmq: RabbitmqService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Kiểm tra trạng thái hệ thống' })
  @ApiResponse({ status: 200, description: 'Hệ thống hoạt động bình thường' })
  async check() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkRabbitMQ(),
    ]);

    const [db, redis, rabbitmq] = checks.map((result) =>
      result.status === 'fulfilled'
        ? result.value
        : { status: 'down', error: (result.reason as Error).message },
    );

    const allUp = [db, redis, rabbitmq].every(
      (check) => (check as { status: string }).status === 'up',
    );

    return {
      status: allUp ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: db,
        redis,
        rabbitmq,
      },
    };
  }

  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up' };
    } catch (error) {
      return { status: 'down', error: (error as Error).message };
    }
  }

  private async checkRedis() {
    try {
      const pong = await this.redis.ping();
      return { status: pong ? 'up' : 'down' };
    } catch (error) {
      return { status: 'down', error: (error as Error).message };
    }
  }

  private async checkRabbitMQ() {
    return {
      status: this.rabbitmq.isConnected() ? 'up' : 'down',
    };
  }
}
