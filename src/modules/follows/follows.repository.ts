import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import {
  Follow,
  FollowDocument,
} from './schemas/follow.schema';

@Injectable()
export class FollowsRepository {
  constructor(
    @InjectModel(Follow.name)
    private readonly followModel: Model<FollowDocument>,
  ) {}

  create(data: Partial<Follow>) {
    return this.followModel.create(data);
  }

  findRelation(
    followerId: string,
    followingId: string,
  ) {
    return this.followModel.findOne({
      follower_id: new Types.ObjectId(followerId),
      following_id: new Types.ObjectId(followingId),
    });
  }

  deleteRelation(
    followerId: string,
    followingId: string,
  ) {
    return this.followModel.findOneAndDelete({
      follower_id: new Types.ObjectId(followerId),
      following_id: new Types.ObjectId(followingId),
    });
  }

  getFollowers(
    userId: string,
    limit: number,
    cursor?: string,
  ) {
    const query: any = {
      following_id: new Types.ObjectId(userId),
      status: 'active',
    };

    if (cursor) {
      query._id = {
        $lt: new Types.ObjectId(cursor),
      };
    }

    return this.followModel
      .find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .populate('follower_id', 'username'); // Only expose public fields
  }

  async getFollowing(
    userId: string,
    limit: number,
    cursor?: string,
  ) {
    const query: any = {
      follower_id: new Types.ObjectId(userId),
      status: 'active',
    };

    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    return this.followModel
      .find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .populate('following_id', 'username'); // Only expose public fields
  }

  getPendingRequests(userId: string) {
    return this.followModel
      .find({
        following_id: new Types.ObjectId(userId),
        status: 'pending',
      })
      .populate('follower_id', '-password');
  }
}