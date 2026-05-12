import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({
    type: [Types.ObjectId],
    ref: 'User',
    required: true,
  })
  participants: Types.ObjectId[];

  @Prop({
    type: Types.ObjectId,
    ref: 'Message',
    default: null,
  })
  lastMessage: Types.ObjectId;

  @Prop({
    type: Date,
    default: Date.now,
  })
  lastActivity: Date;

  @Prop({
    type: Boolean,
    default: false,
  })
  isAccepted: boolean;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  initiator: Types.ObjectId;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastActivity: -1 });