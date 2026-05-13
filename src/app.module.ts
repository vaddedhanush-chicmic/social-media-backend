import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './database/database.module';
import { MailModule } from './modules/mail/mail.module';
import { FollowsModule } from './modules/follows/follows.module';
import { ChatModule } from './modules/chat/chat.module';
import { UploadModule } from './modules/upload/upload.module';
import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';
import mongoConfig from './config/mongo.config';
import uploadConfig from './config/upload.config';
import giphyConfig from './config/giphy.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, mongoConfig, uploadConfig, giphyConfig],
    }),
    // Serve the uploads folder as static files at /uploads/*
    ServeStaticModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          rootPath: config.get<string>('upload.uploadDir') || join(process.cwd(), 'uploads'),
          serveRoot: '/uploads',
          serveStaticOptions: { index: false },
        },
      ],
    }),
    DatabaseModule,
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    CommonModule,
    MailModule,
    FollowsModule,
    ChatModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}