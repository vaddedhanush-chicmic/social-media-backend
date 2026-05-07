import { Module } from '@nestjs/common';
import { APP_GUARD, APP_PIPE, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { SanitizePipe } from './pipes/sanitize.pipe';
import { MongoExceptionFilter } from './filters/mongo-exception.filter';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    },
    {
      provide: APP_PIPE,
      useClass: SanitizePipe,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: MongoExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class CommonModule {}
