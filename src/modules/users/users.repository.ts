import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Profile, ProfileDocument } from './schemas/profile.schema';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
  ) {}

  // User queries
  async create(userData: any): Promise<UserDocument> {
    const newUser = new this.userModel(userData);
    return newUser.save();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ _id: id, deletedAt: { $exists: false } }).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email, deletedAt: { $exists: false } }).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username, deletedAt: { $exists: false } }).exec();
  }

  async findActiveByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ 
      username, 
      isActive: true, 
      deletedAt: { $exists: false } 
    }).exec();
  }

  async findByResetToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    }).exec();
  }

  async findByEmailOrUsername(email: string, username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      $or: [{ email }, { username }],
      deletedAt: { $exists: false },
    }).exec();
  }

  async update(id: string, updateData: any): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(id, updateData, { returnDocument: 'after' }).exec();
  }

  async delete(id: string): Promise<any> {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async search(query: string, limit = 10): Promise<any[]> {
    return this.userModel.aggregate([
      {
        $match: {
          isActive: true,
          deletedAt: { $exists: false },
        },
      },
      {
        $lookup: {
          from: 'profiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile',
        },
      },
      {
        $unwind: {
          path: '$profile',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { 'profile.fullName': { $regex: query, $options: 'i' } },
          ],
        },
      },
      {
        $project: {
          _id: 1,
          username: 1,
          fullName: '$profile.fullName',
          avatarUrl: '$profile.avatarUrl',
        },
      },
      { $limit: limit },
    ]);
  }

  // Profile queries
  async createProfile(profileData: any): Promise<ProfileDocument> {
    const profile = new this.profileModel(profileData);
    return profile.save();
  }

  async findProfileByUserId(
    userId: string, 
    userFields = 'username',
    profileFields = '-__v -isComplete'
  ): Promise<ProfileDocument | null> {
    return this.profileModel
      .findOne({ userId: userId as any })
      .select(profileFields)
      .populate('userId', userFields)
      .exec();
  }

  async updateProfile(userId: string, updateData: any): Promise<ProfileDocument | null> {
    return this.profileModel
      .findOneAndUpdate({ userId: userId as any }, updateData, { returnDocument: 'after' })
      .exec();
  }

  async deleteProfile(userId: string): Promise<any> {
    return this.profileModel.findOneAndDelete({ userId: userId as any }).exec();
  }
}
