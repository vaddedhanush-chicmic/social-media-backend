import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private isConnected = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const port = this.configService.get<number>('REDIS_PORT') || 6379;
    
    this.client = new Redis({
      host,
      port,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 5) return null; // stop retrying after 5 attempts
        return Math.min(times * 200, 2000);
      },
    });

    this.client.on('error', (err) => {
      if (this.isConnected) {
        console.warn('Redis error:', err.message);
      }
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      console.log('Redis service connected');
    });

    this.client.on('close', () => {
      this.isConnected = false;
    });

    try {
      await this.client.connect();
    } catch (err) {
      console.warn(`⚠ Redis unavailable (${err.message}). Token blacklisting and rate limiting will use fallback behavior.`);
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.isConnected) return;
    if (ttl) {
      await this.client.set(key, value, 'EX', ttl);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected) return null;
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) return;
    await this.client.del(key);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    if (!this.isConnected) return false;
    const result = await this.client.get(`blacklist:${token}`);
    return result !== null;
  }

  async blacklistToken(token: string, ttl: number): Promise<void> {
    await this.set(`blacklist:${token}`, 'true', ttl);
  }
}
