import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ChatRepository } from './chat.repository';
import { UsersRepository } from '../users/users.repository';
import { FollowsRepository } from '../follows/follows.repository';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly usersRepository: UsersRepository,
    private readonly followsRepository: FollowsRepository,
  ) {}

  // ── Helpers ───────────────────────────────────────────────────

  private async verifyParticipant(
    conversationId: string,
    userId: string,
  ) {
    const conversation = await this.chatRepository.findConversationById(
      conversationId,
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId,
    );

    if (!isParticipant) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    return conversation;
  }

  // ── Core Permission Check ─────────────────────────────────────

  async canChat(
    senderId: string,
    receiverId: string,
  ): Promise<{ allowed: boolean; requiresRequest: boolean }> {
    const receiver = await this.usersRepository.findById(receiverId);

    if (!receiver) {
      throw new NotFoundException('User not found');
    }

    if (!receiver.isActive || receiver.deletedAt) {
      throw new ForbiddenException('This account is not available');
    }

    if (!receiver.isPrivate) {
      return { allowed: true, requiresRequest: false };
    }

    const relation = await this.followsRepository.findRelation(
      senderId,
      receiverId,
    );

    if (relation && relation.status === 'active') {
      return { allowed: true, requiresRequest: false };
    }

    return { allowed: true, requiresRequest: true };
  }

  // ── Send Message ──────────────────────────────────────────────

  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
  ) {
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send message to yourself');
    }

    const { requiresRequest } = await this.canChat(senderId, receiverId);

    let conversation = await this.chatRepository.findConversation(
      senderId,
      receiverId,
    );

    if (!conversation) {
      conversation = await this.chatRepository.createConversation(
        senderId,
        receiverId,
        !requiresRequest,
      );
    } else {
      if (!conversation.isAccepted) {
        if (conversation.initiator.toString() !== senderId) {
          throw new ForbiddenException(
            'Accept the message request before replying',
          );
        }

        const existingMessages = await this.chatRepository.getMessages(
          conversation._id.toString(),
          2,
        );

        if (existingMessages.length >= 1) {
          throw new ForbiddenException(
            'Wait for the recipient to accept your message request',
          );
        }
      }
    }

    const message = await this.chatRepository.createMessage(
      senderId,
      receiverId,
      conversation._id.toString(),
      content,
    );

    await this.chatRepository.updateLastMessage(
      conversation._id.toString(),
      message._id,
    );

    return {
      message,
      conversation,
      isRequest: requiresRequest && !conversation.isAccepted,
    };
  }

  // ── Chat History ──────────────────────────────────────────────

  async getChatHistory(
    requestingUserId: string,
    targetUserId: string,
    limit: number,
    cursor?: string,
  ) {
    const conversation = await this.chatRepository.findConversation(
      requestingUserId,
      targetUserId,
    );

    if (!conversation) {
      return { data: [], nextCursor: null, hasMore: false };
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === requestingUserId,
    );

    if (!isParticipant) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    // Instagram: only show messages after the user's deletion timestamp
    const userDeletedAt = conversation.deletedAt?.get(requestingUserId);

    const messages = await this.chatRepository.getMessages(
      conversation._id.toString(),
      limit + 1,
      cursor,
      userDeletedAt,
    );

    const hasMore = messages.length > limit;
    const data = hasMore ? messages.slice(0, limit) : messages;

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1]._id : null,
      hasMore,
    };
  }

  // ── Accept / Decline Request ──────────────────────────────────

  async acceptRequest(userId: string, conversationId: string) {
    const conversation = await this.chatRepository.acceptConversation(
      conversationId,
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.initiator.toString() === userId) {
      throw new ForbiddenException('You cannot accept your own request');
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId,
    );

    if (!isParticipant) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    return { message: 'Message request accepted', conversation };
  }

  async declineRequest(userId: string, conversationId: string) {
    const conversation = await this.chatRepository.findConversationById(
      conversationId,
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.initiator.toString() === userId) {
      throw new ForbiddenException('You cannot decline your own request');
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId,
    );

    if (!isParticipant) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    // Hard delete — declined requests are gone for both sides
    await this.chatRepository.deleteConversation(conversationId);

    return { message: 'Message request declined' };
  }

  // ── Conversations List ────────────────────────────────────────

  async getConversations(userId: string) {
    const conversations =
      await this.chatRepository.getUserConversations(userId, false);
    return { data: conversations };
  }

  async getArchivedConversations(userId: string) {
    const conversations =
      await this.chatRepository.getUserConversations(userId, true);
    return { data: conversations };
  }

  // ── Delete Conversation (Instagram: for me only) ──────────────

  async deleteConversationForMe(userId: string, conversationId: string) {
    await this.verifyParticipant(conversationId, userId);

    await this.chatRepository.deleteConversationForUser(
      conversationId,
      userId,
    );

    return { message: 'Conversation deleted' };
  }

  // ── Archive / Unarchive ───────────────────────────────────────

  async archiveConversation(userId: string, conversationId: string) {
    await this.verifyParticipant(conversationId, userId);

    await this.chatRepository.archiveConversation(conversationId, userId);

    return { message: 'Conversation archived' };
  }

  async unarchiveConversation(userId: string, conversationId: string) {
    await this.verifyParticipant(conversationId, userId);

    await this.chatRepository.unarchiveConversation(conversationId, userId);

    return { message: 'Conversation unarchived' };
  }

  // ── Mark As Read ──────────────────────────────────────────────

  async markAsRead(userId: string, conversationId: string) {
    await this.verifyParticipant(conversationId, userId);

    await this.chatRepository.markAsRead(conversationId, userId);

    return { message: 'Messages marked as read' };
  }

  // ── Delete Message (Instagram: unsend for both sides) ─────────

  async recallMessage(userId: string, messageId: string) {
    const message = await this.chatRepository.recallMessage(
      messageId,
      userId,
    );

    if (!message) {
      throw new NotFoundException(
        'Message not found or you are not the sender',
      );
    }

    return { message: 'Message unsent', data: message };
  }

  // ── Soft delete kept for admin use ────────────────────────────

  async deleteMessage(userId: string, messageId: string) {
    const message = await this.chatRepository.softDeleteMessage(
      messageId,
      userId,
    );

    if (!message) {
      throw new NotFoundException(
        'Message not found or you are not the sender',
      );
    }

    return { message: 'Message deleted' };
  }
}