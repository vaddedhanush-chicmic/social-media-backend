import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../database/redis.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private redisService: RedisService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const limit = this.configService.get<number>('RATE_LIMIT_MAX') || 10;
    const ttl = (this.configService.get<number>('RATE_LIMIT_TTL') || 60000) / 1000; // convert ms to seconds
    
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    const key = `rate_limit:${ip}`;

    const currentHits = await this.redisService.get(key);
    const hits = currentHits ? parseInt(currentHits) : 0;

    if (hits >= limit) {
      throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    await this.redisService.set(key, (hits + 1).toString(), Math.floor(ttl));
    return true;
  }
}
