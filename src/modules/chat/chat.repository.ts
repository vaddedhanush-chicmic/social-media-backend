import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';

@Injectable()
export class ChatRepository {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
  ) {}

  // ── Conversation ──────────────────────────────────────────────

  async findConversation(
    userAId: string,
    userBId: string,
  ): Promise<ConversationDocument | null> {
    return this.conversationModel.findOne({
      participants: {
        $all: [
          new Types.ObjectId(userAId),
          new Types.ObjectId(userBId),
        ],
      },
    }).exec();
  }

  async findConversationById(
    conversationId: string,
  ): Promise<ConversationDocument | null> {
    return this.conversationModel.findById(conversationId).exec();
  }

  async createConversation(
    initiatorId: string,
    receiverId: string,
    isAccepted: boolean,
  ): Promise<ConversationDocument> {
    const conversation = new this.conversationModel({
      participants: [
        new Types.ObjectId(initiatorId),
        new Types.ObjectId(receiverId),
      ],
      initiator: new Types.ObjectId(initiatorId),
      isAccepted,
    });
    return conversation.save();
  }

  async acceptConversation(
    conversationId: string,
  ): Promise<ConversationDocument | null> {
    return this.conversationModel.findByIdAndUpdate(
      conversationId,
      { isAccepted: true },
      { returnDocument: 'after' },
    ).exec();
  }

  // Hard delete — only used for decline request
  async deleteConversation(conversationId: string): Promise<void> {
    await this.conversationModel.findByIdAndDelete(conversationId).exec();
    await this.messageModel.deleteMany({
      conversationId: new Types.ObjectId(conversationId),
    }).exec();
  }

  async updateLastMessage(
    conversationId: string,
    messageId: Types.ObjectId,
  ): Promise<void> {
    await this.conversationModel.findByIdAndUpdate(conversationId, {
      lastMessage: messageId,
      lastActivity: new Date(),
    }).exec();
  }

  async deleteConversationForUser(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    await this.conversationModel.findByIdAndUpdate(conversationId, {
      $set: { [`deletedAt.${userId}`]: new Date() },
    }).exec();
  }

  async archiveConversation(
    conversationId: string,
    userId: string,
  ): Promise<ConversationDocument | null> {
    return this.conversationModel.findByIdAndUpdate(
      conversationId,
      { $addToSet: { archivedFor: new Types.ObjectId(userId) } },
      { returnDocument: 'after' },
    ).exec();
  }

  // Instagram: unarchive for this user
  async unarchiveConversation(
    conversationId: string,
    userId: string,
  ): Promise<ConversationDocument | null> {
    return this.conversationModel.findByIdAndUpdate(
      conversationId,
      { $pull: { archivedFor: new Types.ObjectId(userId) } },
      { returnDocument: 'after' },
    ).exec();
  }

  async getUserConversations(
    userId: string,
    includeArchived = false,
  ): Promise<ConversationDocument[]> {
    const query: any = {
      participants: new Types.ObjectId(userId),
      [`deletedAt.${userId}`]: { $exists: false },
    };

    if (!includeArchived) {
      query.archivedFor = { $ne: new Types.ObjectId(userId) };
    } else {
      query.archivedFor = new Types.ObjectId(userId);
    }

    return this.conversationModel
      .find(query)
      .populate('lastMessage')
      .populate('participants', 'username')
      .sort({ lastActivity: -1 })
      .exec();
  }

  // ── Message ───────────────────────────────────────────────────

  async createMessage(
    senderId: string,
    receiverId: string,
    conversationId: string,
    content: string,
  ): Promise<MessageDocument> {
    const message = new this.messageModel({
      senderId: new Types.ObjectId(senderId),
      receiverId: new Types.ObjectId(receiverId),
      conversationId: new Types.ObjectId(conversationId),
      content,
    });
    return message.save();
  }

  async getMessages(
    conversationId: string,
    limit: number,
    cursor?: string,
    after?: Date,
    userId?: string,
  ): Promise<MessageDocument[]> {
    const query: any = {
      conversationId: new Types.ObjectId(conversationId),
      deletedAt: null,
      recalled: false,
    };

    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    // Only show messages sent after the user deleted the chat
    if (after) {
      query.createdAt = { $gt: after };
    }

    // Exclude messages deleted for this user
    if (userId) {
      query.deletedFor = { $ne: new Types.ObjectId(userId) };
    }

    return this.messageModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async markAsRead(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    await this.messageModel.updateMany(
      {
        conversationId: new Types.ObjectId(conversationId),
        receiverId: new Types.ObjectId(userId),
        isRead: false,
      },
      { isRead: true },
    ).exec();
  }

  async recallMessage(
    messageId: string,
    userId: string,
  ): Promise<MessageDocument | null> {
    return this.messageModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(messageId),
        senderId: new Types.ObjectId(userId),
        recalled: false,
      },
      {
        recalled: true,
        recalledAt: new Date(),
      },
      { returnDocument: 'after' },
    ).exec();
  }

  async deleteMessageForUser(
    messageId: string,
    userId: string,
  ): Promise<MessageDocument | null> {
    return this.messageModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(messageId),
        deletedFor: { $ne: new Types.ObjectId(userId) },
        recalled: false,
        deletedAt: null,
      },
      { $addToSet: { deletedFor: new Types.ObjectId(userId) } },
      { returnDocument: 'after' },
    ).exec();
  }

  async softDeleteMessage(
    messageId: string,
    userId: string,
  ): Promise<MessageDocument | null> {
    return this.messageModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(messageId),
        senderId: new Types.ObjectId(userId),
        deletedAt: null,
      },
      { deletedAt: new Date() },
      { returnDocument: 'after' },
    ).exec();
  }

  async countUnreadMessages(
    conversationId: string,
    userId: string,
  ): Promise<number> {
    return this.messageModel.countDocuments({
      conversationId: new Types.ObjectId(conversationId),
      receiverId: new Types.ObjectId(userId),
      isRead: false,
      recalled: false,
    }).exec();
  }
}