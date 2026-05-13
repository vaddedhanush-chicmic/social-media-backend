import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
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
import { ChatGateway } from './chat.gateway';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatHistoryQueryDto } from './dto/chat-history-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  // ── Send Message ──────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Send a message' })
  async sendMessage(
    @CurrentUser() user: any,
    @Body() dto: SendMessageDto,
  ) {
    const result = await this.chatService.sendMessage(
      user.userId,
      dto.toUserId,
      dto.content,
    );

    // Push via socket even when sent via REST
    if (result.isRequest) {
      this.chatGateway.emitToUser(dto.toUserId, 'message_request', {
        conversation: result.conversation,
        message: result.message,
      });
    } else {
      this.chatGateway.emitToUser(dto.toUserId, 'new_message', result.message);
    }

    return result;
  }

  // ── Chat History ──────────────────────────────────────────────

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

  // ── Conversations ─────────────────────────────────────────────

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations (inbox)' })
  async getConversations(@CurrentUser() user: any) {
    return this.chatService.getConversations(user.userId);
  }

  @Get('conversations/archived')
  @ApiOperation({ summary: 'Get archived conversations' })
  async getArchivedConversations(@CurrentUser() user: any) {
    return this.chatService.getArchivedConversations(user.userId);
  }

  @Delete('conversation/:conversationId')
  @ApiOperation({ summary: 'Delete conversation for me only' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  async deleteConversation(
    @CurrentUser() user: any,
    @Param('conversationId', ParseObjectIdPipe) conversationId: string,
  ) {
    return this.chatService.deleteConversationForMe(
      user.userId,
      conversationId,
    );
  }

  @Patch('conversation/:conversationId/archive')
  @ApiOperation({ summary: 'Archive a conversation' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  async archiveConversation(
    @CurrentUser() user: any,
    @Param('conversationId', ParseObjectIdPipe) conversationId: string,
  ) {
    return this.chatService.archiveConversation(user.userId, conversationId);
  }

  @Patch('conversation/:conversationId/unarchive')
  @ApiOperation({ summary: 'Unarchive a conversation' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  async unarchiveConversation(
    @CurrentUser() user: any,
    @Param('conversationId', ParseObjectIdPipe) conversationId: string,
  ) {
    return this.chatService.unarchiveConversation(user.userId, conversationId);
  }

  // ── Message ───────────────────────────────────────────────────

  @Delete('message/:messageId/me')
  @ApiOperation({ summary: 'Delete a message for me only' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  async deleteMessageForMe(
    @CurrentUser() user: any,
    @Param('messageId', ParseObjectIdPipe) messageId: string,
  ) {
    return this.chatService.deleteMessageForMe(user.userId, messageId);
  }

  @Delete('message/:messageId')
  @ApiOperation({ summary: 'Unsend a message (removes for both sides)' })
  @ApiParam({ name: 'messageId', description: 'Message ID to unsend' })
  async recallMessage(
    @CurrentUser() user: any,
    @Param('messageId', ParseObjectIdPipe) messageId: string,
  ) {
    const result = await this.chatService.recallMessage(
      user.userId,
      messageId,
    );

    // Notify the other participant via socket
    const receiverId = result.data.receiverId.toString();
    this.chatGateway.emitToUser(receiverId, 'message_recalled', {
      messageId,
      conversationId: result.data.conversationId,
    });

    return result;
  }
}