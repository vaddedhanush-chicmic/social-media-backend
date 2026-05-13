import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatHistoryQueryDto } from './dto/chat-history-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { UploadService } from '../upload/upload.service';
import { UploadContext } from '../upload/upload.constants';
import { multerConfig } from '../upload/multer.config';
import { GiphyService } from './giphy.service';
import { GifSearchQueryDto } from './dto/gif-search-query.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
    private readonly uploadService: UploadService,
    private readonly giphyService: GiphyService,
  ) {}

  // ── Send Message ──────────────────────────────────────────────

  @Post()
  @UseInterceptors(FilesInterceptor('attachments', 5, multerConfig()))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Send a message (text, image, video, gif or mix)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        toUserId:    { type: 'string' },
        content:     { type: 'string' },
        gifUrl:      { type: 'string' },
        attachments: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  async sendMessage(
    @CurrentUser() user: any,
    @Body() dto: SendMessageDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    // Must have at least one of: text, gif, file
    if (!dto.content && !dto.gifUrl && (!files || files.length === 0)) {
      throw new BadRequestException(
        'Message must have text, a GIF, or an attachment',
      );
    }

    // Upload all files and collect attachment objects
    const attachments = await Promise.all(
      (files ?? []).map(async (file) => {
        const { url, mimeType, size } = await this.uploadService.saveFile(
          file,
          UploadContext.CHAT,
          user.userId,
        );
        return { url, mimeType, size, originalName: file.originalname };
      }),
    );

    const result = await this.chatService.sendMessage(
      user.userId,
      dto.toUserId,
      dto.content,
      attachments,
      dto.gifUrl,
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

    const receiverId = result.data.receiverId.toString();
    this.chatGateway.emitToUser(receiverId, 'message_recalled', {
      messageId,
      conversationId: result.data.conversationId,
    });

    return result;
  }
  // ── GIF ───────────────────────────────────────────────────────

  @Get('gifs/trending')
  @ApiOperation({ summary: 'Get trending GIFs from Giphy' })
  async trendingGifs() {
    return this.giphyService.trending();
  }

  @Get('gifs/search')
  @ApiOperation({ summary: 'Search GIFs on Giphy' })
  async searchGifs(@Query() query: GifSearchQueryDto) {
    return this.giphyService.search(query.q, query.limit);
  }
}