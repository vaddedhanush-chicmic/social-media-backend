import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;

export enum PostVisibility {
  PUBLIC = 'public',
  FOLLOWERS = 'followers',
}

export enum PostMediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  TEXT  = 'text',
}

@Schema({ _id: false })
export class PostMedia {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  originalName: string;
}

export const PostMediaSchema = SchemaFactory.createForClass(PostMedia);

@Schema({ timestamps: true })
export class Post {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  authorId: Types.ObjectId;

  @Prop({
    type: String,
    trim: true,
    maxlength: 2200,
    default: null,
  })
  caption: string | null;

  @Prop({
    type: [PostMediaSchema],
    default: [],
  })
  media: PostMedia[];

  @Prop({
    type: String,
    enum: PostMediaType,
    required: true,
  })
  mediaType: PostMediaType;

  @Prop({
    type: String,
    enum: PostVisibility,
    default: PostVisibility.PUBLIC,
  })
  visibility: PostVisibility;

  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  commentsCount: number;

  @Prop({ default: false })
  isArchived: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.index({ authorId: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index(
  { deletedAt: 1 },
  { partialFilterExpression: { deletedAt: { $exists: false } } },
);