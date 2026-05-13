import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatRepository } from './chat.repository';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { Message, MessageSchema } from './schemas/message.schema';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { UsersModule } from '../users/users.module';
import { FollowsModule } from '../follows/follows.module';
import { UploadModule } from '../upload/upload.module';
import { GiphyService } from './giphy.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Conversation.name, schema: ConversationSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
      }),
    }),
    UsersModule,
    FollowsModule,
    UploadModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatGateway,
    ChatService,
    ChatRepository,
    WsJwtGuard,
    GiphyService,
  ],
})
export class ChatModule {}