import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './database/database.module';
import { MailModule } from './modules/mail/mail.module';
import { FollowsModule } from './modules/follows/follows.module';
import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';
import mongoConfig from './config/mongo.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, mongoConfig],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    CommonModule,
    MailModule,
    FollowsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
