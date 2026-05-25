import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  constructor(
    app: INestApplication,
    private configService: ConfigService,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const host = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const port = this.configService.get<number>('REDIS_PORT') || 6379;

    const redisOptions = {
      host,
      port,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 5) return null; // stop retrying after 5 attempts
        return Math.min(times * 200, 2000);
      },
    };

    const pubClient = new Redis(redisOptions);
    const subClient = pubClient.duplicate();

    pubClient.on('error', (err) => console.warn('Redis pub error:', err.message));
    subClient.on('error', (err) => console.warn('Redis sub error:', err.message));

    try {
      // Attempt to connect with a timeout
      await Promise.race([
        Promise.all([pubClient.connect(), subClient.connect()]),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis connection timeout')), 5000),
        ),
      ]);

      this.adapterConstructor = createAdapter(pubClient, subClient);
      console.log(`Redis adapter connected — ${host}:${port}`);
    } catch (err) {
      console.warn(
        `⚠ Redis unavailable (${err.message}). WebSocket scaling disabled — using in-memory adapter.`,
      );
      // Clean up failed connections silently
      pubClient.disconnect();
      subClient.disconnect();
      // adapterConstructor stays undefined; createIOServer will use default adapter
    }
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}