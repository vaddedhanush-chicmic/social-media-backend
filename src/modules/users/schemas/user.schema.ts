import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  verificationToken?: string;

  @Prop()
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpires?: Date;

  @Prop({ default: 0 })
  followersCount: number;

  @Prop({ default: 0 })
  followingCount: number;
  
  @Prop({ default: 0 })
  postsCount: number;

  @Prop({ default: false })
  isPrivate: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  deactivatedAt?: Date;

  @Prop()
  deletedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Partial unique indexes: Only enforce uniqueness if the account is NOT deleted
UserSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { deletedAt: { $exists: false } } },
);
UserSchema.index(
  { username: 1 },
  { unique: true, partialFilterExpression: { deletedAt: { $exists: false } } },
);
