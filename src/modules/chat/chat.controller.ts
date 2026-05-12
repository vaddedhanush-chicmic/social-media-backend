import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatHistoryQueryDto } from './dto/chat-history-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message' })
  async sendMessage(
    @CurrentUser() user: any,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(
      user.userId,
      dto.toUserId,
      dto.content,
    );
  }

  @Get('history/:userId')
  @ApiOperation({ summary: 'Get chat history with a user' })
  @ApiParam({ name: 'userId', description: 'The other user ID' })
  async getChatHistory(
    @CurrentUser() user: any,
    @Param('userId', ParseObjectIdPipe) userId: string,
    @Query() query: ChatHistoryQueryDto,
  ) {
    return this.chatService.getChatHistory(
      user.userId,
      userId,
      query.limit ?? 20,
      query.cursor,
    );
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations' })
  async getConversations(@CurrentUser() user: any) {
    return this.chatService.getConversations(user.userId);
  }

  @Delete('message/:messageId')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiParam({ name: 'messageId', description: 'Message ID to delete' })
  async deleteMessage(
    @CurrentUser() user: any,
    @Param('messageId', ParseObjectIdPipe) messageId: string,
  ) {
    return this.chatService.deleteMessage(user.userId, messageId);
  }
}