import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const port = this.configService.get<number>('REDIS_PORT') || 6379;
    
    this.client = new Redis({
      host,
      port,
    });

    this.client.on('error', (err) => {
      console.warn('Redis error:', err.message);
    });
  }

  onModuleDestroy() {
    this.client.quit();
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.set(key, value, 'EX', ttl);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const result = await this.client.get(`blacklist:${token}`);
    return result !== null;
  }

  async blacklistToken(token: string, ttl: number): Promise<void> {
    await this.set(`blacklist:${token}`, 'true', ttl);
  }
}
