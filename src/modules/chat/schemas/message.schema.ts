import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  senderId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  receiverId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Conversation',
    required: true,
  })
  conversationId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  content: string;

  @Prop({
    default: false,
  })
  isRead: boolean;

  @Prop({
    type: Date,
    default: null,
  })
  deletedAt: Date;

  @Prop({
    type: Boolean,
    default: false,
  })
  recalled: boolean;

  @Prop({
    type: Date,
    default: null,
  })
  recalledAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ conversationId: 1, createdAt: -1 });