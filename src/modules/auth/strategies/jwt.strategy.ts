import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../database/redis.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret') || 'secret',
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token || await this.redisService.isBlacklisted(token)) {
      throw new UnauthorizedException('Token is blacklisted or invalid');
    }
    return { userId: payload.sub, email: payload.email, username: payload.username };
  }
}
