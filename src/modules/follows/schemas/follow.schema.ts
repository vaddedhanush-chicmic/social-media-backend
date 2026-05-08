import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FollowDocument = HydratedDocument<Follow>;

@Schema({
  timestamps: true,
})
export class Follow {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  follower_id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  following_id: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['active', 'pending'],
    default: 'active',
  })
  status: string;
}

export const FollowSchema = SchemaFactory.createForClass(Follow);

FollowSchema.index(
  { follower_id: 1, following_id: 1 },
  { unique: true },
);

FollowSchema.index({
  following_id: 1,
  createdAt: -1,
});

FollowSchema.index({
  follower_id: 1,
  createdAt: -1,
});

FollowSchema.index(
  {
    following_id: 1,
    status: 1,
  },
  {
    partialFilterExpression: {
      status: 'pending',
    },
  },
);