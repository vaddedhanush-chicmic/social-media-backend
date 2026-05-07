import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from './redis.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongo.uri'),
      }),
    }),
    RedisModule,
  ],
  exports: [MongooseModule, RedisModule],
})
export class DatabaseModule {}
