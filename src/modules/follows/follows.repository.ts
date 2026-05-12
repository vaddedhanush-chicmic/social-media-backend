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

  async getFollowers(
    userId: string,
    limit: number,
    requestingUserId: string,
    cursor?: string,
  ) {
    const pipeline: any[] = [
      {
        $match: {
          following_id: new Types.ObjectId(userId),
          status: 'active',
          ...(cursor ? { _id: { $lt: new Types.ObjectId(cursor) } } : {}),
        },
      },
      { $sort: { _id: -1 } },
      { $limit: limit },
      // Join User info
      {
        $lookup: {
          from: 'users',
          localField: 'follower_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      // Join Profile info
      {
        $lookup: {
          from: 'profiles',
          localField: 'follower_id',
          foreignField: 'userId',
          as: 'profile',
        },
      },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
      // Check if they follow the requester back
      {
        $lookup: {
          from: 'follows',
          let: { followerId: '$follower_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$follower_id', '$$followerId'] },
                    { $eq: ['$following_id', new Types.ObjectId(requestingUserId)] },
                    { $eq: ['$status', 'active'] },
                  ],
                },
              },
            },
          ],
          as: 'followBack',
        },
      },
      {
        $project: {
          _id: 1,
          userId: '$user._id',
          username: '$user.username',
          isPrivate: '$user.isPrivate',
          fullName: '$profile.fullName',
          avatarUrl: '$profile.avatarUrl',
          isFollowingBack: { $gt: [{ $size: '$followBack' }, 0] },
        },
      },
    ];

    return this.followModel.aggregate(pipeline);
  }

  async getFollowing(
    userId: string,
    limit: number,
    requestingUserId: string,
    cursor?: string,
  ) {
    const pipeline: any[] = [
      {
        $match: {
          follower_id: new Types.ObjectId(userId),
          status: 'active',
          ...(cursor ? { _id: { $lt: new Types.ObjectId(cursor) } } : {}),
        },
      },
      { $sort: { _id: -1 } },
      { $limit: limit },
      // Join User info
      {
        $lookup: {
          from: 'users',
          localField: 'following_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      // Join Profile info
      {
        $lookup: {
          from: 'profiles',
          localField: 'following_id',
          foreignField: 'userId',
          as: 'profile',
        },
      },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
      // Check if they follow the requester back
      {
        $lookup: {
          from: 'follows',
          let: { followingId: '$following_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$follower_id', '$$followingId'] },
                    { $eq: ['$following_id', new Types.ObjectId(requestingUserId)] },
                    { $eq: ['$status', 'active'] },
                  ],
                },
              },
            },
          ],
          as: 'followBack',
        },
      },
      {
        $project: {
          _id: 1,
          userId: '$user._id',
          username: '$user.username',
          isPrivate: '$user.isPrivate',
          fullName: '$profile.fullName',
          avatarUrl: '$profile.avatarUrl',
          isFollowingBack: { $gt: [{ $size: '$followBack' }, 0] },
        },
      },
    ];

    return this.followModel.aggregate(pipeline);
  }

  async getMutualFollowers(
    targetUserId: string,
    requestingUserId: string,
    limit: number,
    cursor?: string,
  ) {
    const pipeline: any[] = [
      // 1. Find users followed by the requester
      {
        $match: {
          follower_id: new Types.ObjectId(requestingUserId),
          status: 'active',
        },
      },
      // 2. Filter for those who also follow the target user
      {
        $lookup: {
          from: 'follows',
          let: { followingId: '$following_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$follower_id', '$$followingId'] },
                    { $eq: ['$following_id', new Types.ObjectId(targetUserId)] },
                    { $eq: ['$status', 'active'] },
                    ...(cursor ? [{ $lt: ['$_id', new Types.ObjectId(cursor)] }] : []),
                  ],
                },
              },
            },
          ],
          as: 'mutualFollow',
        },
      },
      { $unwind: '$mutualFollow' },
      { $limit: limit },
      // 3. Join User and Profile info for the mutual friend
      {
        $lookup: {
          from: 'users',
          localField: 'following_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'profiles',
          localField: 'following_id',
          foreignField: 'userId',
          as: 'profile',
        },
      },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
      // 4. Project final shape
      {
        $project: {
          _id: '$mutualFollow._id', // Use the target's follow record ID for cursor
          userId: '$user._id',
          username: '$user.username',
          fullName: '$profile.fullName',
          avatarUrl: '$profile.avatarUrl',
          isFollowingBack: { $literal: true }, // By definition, you follow them in this list
        },
      },
    ];

    return this.followModel.aggregate(pipeline);
  }

  async getPendingRequests(
    userId: string,
    limit: number,
    cursor?: string,
  ) {
    const query: any = {
      following_id: new Types.ObjectId(userId),
      status: 'pending',
    };

    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    return this.followModel
      .find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .populate('follower_id', 'username');
  }

  async getSentRequests(
    userId: string,
    limit: number,
    cursor?: string,
  ) {
    const query: any = {
      follower_id: new Types.ObjectId(userId),
      status: 'pending',
    };

    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    return this.followModel
      .find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .populate('following_id', 'username');
  }
}