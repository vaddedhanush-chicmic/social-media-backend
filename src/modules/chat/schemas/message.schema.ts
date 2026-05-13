import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ _id: false })
export class Attachment {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  originalName: string;
}

export const AttachmentSchema = SchemaFactory.createForClass(Attachment);

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

  // Optional — image-only messages have no text
  @Prop({
    type: String,
    trim: true,
    default: null,
  })
  content: string | null;

  // Optional — text-only messages have no attachments
  @Prop({
    type: [AttachmentSchema],
    default: [],
  })
  attachments: Attachment[];

  // Optional — gif URL from Giphy
  @Prop({
    type: String,
    default: null,
  })
  gifUrl: string | null;

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
    type: [Types.ObjectId],
    ref: 'User',
    default: [],
  })
  deletedFor: Types.ObjectId[];

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