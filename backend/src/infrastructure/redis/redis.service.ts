import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Redis Service — quản lý cache, mutex lock, và session
 * Cung cấp API chuẩn: get/set/del + mutex lock chống cache stampede
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>('redis.host', 'localhost'),
      port: this.configService.get<number>('redis.port', 6379),
      password: this.configService.get<string>('redis.password') || undefined,
      db: this.configService.get<number>('redis.db', 0),
      retryStrategy: (times: number) => {
        // Retry kết nối tối đa 10 lần, mỗi lần tăng thêm 200ms
        if (times > 10) return null;
        return Math.min(times * 200, 3000);
      },
    });

    this.client.on('connect', () => {
      this.logger.log('✅ Kết nối Redis thành công');
    });

    this.client.on('error', (error: Error) => {
      this.logger.error(`❌ Lỗi Redis: ${error.message}`);
    });
  }

  /** Lấy Redis client gốc — dùng cho BullMQ hoặc thao tác nâng cao */
  getClient(): Redis {
    return this.client;
  }

  /** Lấy giá trị từ cache */
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  /** Lấy giá trị và parse JSON */
  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  /** Lưu giá trị vào cache với TTL (giây) */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  /** Lưu object dưới dạng JSON với TTL */
  async setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  /** Xóa key khỏi cache */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /** Xóa nhiều key theo pattern (dùng SCAN, không dùng KEYS để tránh block) */
  async delByPattern(pattern: string): Promise<void> {
    const stream = this.client.scanStream({ match: pattern, count: 100 });
    const pipeline = this.client.pipeline();

    for await (const keys of stream) {
      for (const key of keys as string[]) {
        pipeline.del(key);
      }
    }

    await pipeline.exec();
  }

  /**
   * Mutex lock — chống cache stampede
   * Chỉ 1 request được rebuild cache, các request khác chờ
   */
  async acquireLock(key: string, ttlSeconds = 10): Promise<boolean> {
    const result = await this.client.set(key, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  /** Giải phóng mutex lock */
  async releaseLock(key: string): Promise<void> {
    await this.client.del(key);
  }

  /** Kiểm tra key có tồn tại không */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /** Tăng counter (dùng cho rate limiting, thống kê) */
  async incr(key: string, ttlSeconds?: number): Promise<number> {
    const result = await this.client.incr(key);
    if (ttlSeconds && result === 1) {
      await this.client.expire(key, ttlSeconds);
    }
    return result;
  }

  /** Kiểm tra kết nối Redis */
  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('🔌 Ngắt kết nối Redis');
  }
}
