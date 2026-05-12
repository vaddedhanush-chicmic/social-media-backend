import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { SendMessageDto } from './dto/send-message.dto';
import { AcceptDeclineDto } from './dto/accept-decline.dto';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>();

  constructor(private readonly chatService: ChatService) {}

  // ── Connection ────────────────────────────────────────────────

  async handleConnection(client: Socket) {
    try {
      const userId = client.handshake.query.userId as string;

      if (!userId) {
        client.disconnect();
        return;
      }

      this.connectedUsers.set(userId, client.id);
      client.data.userId = userId;

      console.log(`User ${userId} connected — socket ${client.id}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      console.log(`User ${userId} disconnected`);
    }
  }

  // ── Helper ────────────────────────────────────────────────────

  public emitToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }

  // ── Events ────────────────────────────────────────────────────

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    try {
      const senderId = client.data.userId;
      const result = await this.chatService.sendMessage(
        senderId,
        dto.toUserId,
        dto.content,
      );

      if (result.isRequest) {
        this.emitToUser(dto.toUserId, 'message_request', {
          conversation: result.conversation,
          message: result.message,
        });
        client.emit('request_sent', {
          conversation: result.conversation,
          message: result.message,
        });
        return;
      }

      this.emitToUser(dto.toUserId, 'new_message', result.message);
      client.emit('new_message', result.message);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { toUserId: string },
  ) {
    this.emitToUser(body.toUserId, 'typing_indicator', {
      fromUserId: client.data.userId,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('stop_typing')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { toUserId: string },
  ) {
    this.emitToUser(body.toUserId, 'stop_typing_indicator', {
      fromUserId: client.data.userId,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: string },
  ) {
    try {
      const userId = client.data.userId;
      await this.chatService.markAsRead(userId, body.conversationId);
      client.emit('messages_read', { conversationId: body.conversationId });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('recall_message')
  async handleRecallMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { messageId: string },
  ) {
    try {
      const userId = client.data.userId;
      const result = await this.chatService.recallMessage(userId, body.messageId);

      const receiverId = result.data.receiverId.toString();

      // Notify both sides — message disappears for everyone
      this.emitToUser(receiverId, 'message_recalled', {
        messageId: body.messageId,
        conversationId: result.data.conversationId,
      });
      client.emit('message_recalled', {
        messageId: body.messageId,
        conversationId: result.data.conversationId,
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('delete_conversation')
  async handleDeleteConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: string },
  ) {
    try {
      const userId = client.data.userId;
      await this.chatService.deleteConversationForMe(userId, body.conversationId);

      // Only emit back to the sender — other participant is unaffected
      client.emit('conversation_deleted', {
        conversationId: body.conversationId,
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('accept_request')
  async handleAcceptRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: AcceptDeclineDto,
  ) {
    try {
      const userId = client.data.userId;
      const result = await this.chatService.acceptRequest(
        userId,
        dto.conversationId,
      );

      const initiatorId = result.conversation.initiator.toString();
      this.emitToUser(initiatorId, 'request_accepted', {
        conversationId: dto.conversationId,
      });
      client.emit('request_accepted', {
        conversationId: dto.conversationId,
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('decline_request')
  async handleDeclineRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: AcceptDeclineDto,
  ) {
    try {
      const userId = client.data.userId;
      await this.chatService.declineRequest(userId, dto.conversationId);

      client.emit('request_declined', {
        conversationId: dto.conversationId,
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }
}