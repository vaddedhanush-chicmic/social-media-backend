import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';

export type ProfileDocument = Profile & Document;

@Schema({ timestamps: true })
export class Profile {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: User;

  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ trim: true })
  bio?: string;

  @Prop()
  avatarUrl?: string;

  @Prop({ type: [String], default: [] })
  interests: string[];

  @Prop({
    type: {
      twitter: String,
      instagram: String,
      linkedin: String,
      website: String,
    },
    _id: false,
  })
  socialLinks: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    website?: string;
  };

  @Prop({ default: false })
  isComplete: boolean;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
