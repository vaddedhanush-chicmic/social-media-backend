import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { Types } from 'mongoose';

import { FollowsRepository } from './follows.repository';
import { UsersRepository } from '../users/users.repository';

@Injectable()
export class FollowsService {
  constructor(
    private readonly followsRepository: FollowsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async followUser(
    currentUserId: string,
    targetUserId: string,
  ) {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const targetUser = await this.usersRepository.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const existingRelation = await this.followsRepository.findRelation(
      currentUserId,
      targetUserId,
    );

    if (existingRelation) {
      throw new BadRequestException('Already following or pending');
    }

    const status = targetUser.isPrivate ? 'pending' : 'active';

    await this.followsRepository.create({
      follower_id: new Types.ObjectId(currentUserId),
      following_id: new Types.ObjectId(targetUserId),
      status,
    });

    if (status === 'active') {
      await this.usersRepository.incrementFollowing(currentUserId);
      await this.usersRepository.incrementFollowers(targetUserId);
    }

    return {
      message: status === 'pending' ? 'Follow request sent' : 'User followed successfully',
    };
  }

  async unfollowUser(currentUserId: string, targetUserId: string) {
    const relation = await this.followsRepository.deleteRelation(
      currentUserId,
      targetUserId,
    );

    if (!relation) {
      throw new NotFoundException('Follow relation not found');
    }

    if (relation.status === 'active') {
      await this.usersRepository.decrementFollowing(currentUserId);
      await this.usersRepository.decrementFollowers(targetUserId);
    }

    return { message: 'User unfollowed successfully' };
  }

  async acceptRequest(currentUserId: string, requesterId: string) {
    const relation = await this.followsRepository.findRelation(
      requesterId,
      currentUserId,
    );

    if (!relation || relation.status !== 'pending') {
      throw new NotFoundException('Pending follow request not found');
    }

    relation.status = 'active';
    await relation.save();

    await this.usersRepository.incrementFollowing(requesterId);
    await this.usersRepository.incrementFollowers(currentUserId);

    return { message: 'Follow request accepted' };
  }

  async rejectRequest(currentUserId: string, requesterId: string) {
    await this.followsRepository.deleteRelation(requesterId, currentUserId);
    return { message: 'Follow request rejected' };
  }

  async getFollowers(
    userId: string,
    limit: number,
    requestingUserId: string,
    cursor?: string,
  ) {
    // Privacy Check
    if (userId.toString() !== requestingUserId.toString()) {
      const user = await this.usersRepository.findById(userId);
      if (user?.isPrivate) {
        const relation = await this.followsRepository.findRelation(requestingUserId, userId);
        if (!relation || relation.status !== 'active') {
          throw new ForbiddenException('This account is private. Follow to see their followers.');
        }
      }
    }

    const data = await this.followsRepository.getFollowers(
      userId,
      limit + 1,
      requestingUserId,
      cursor,
    );

    const hasMore = data.length > limit;
    const finalData = hasMore ? data.slice(0, limit) : data;

    return {
      data: finalData,
      nextCursor: hasMore ? finalData[finalData.length - 1]._id : null,
      hasMore,
    };
  }

  async getFollowing(
    userId: string,
    limit: number,
    requestingUserId: string,
    cursor?: string,
  ) {
    // Privacy Check
    if (userId.toString() !== requestingUserId.toString()) {
      const user = await this.usersRepository.findById(userId);
      if (user?.isPrivate) {
        const relation = await this.followsRepository.findRelation(requestingUserId, userId);
        if (!relation || relation.status !== 'active') {
          throw new ForbiddenException('This account is private. Follow to see who they follow.');
        }
      }
    }

    const data = await this.followsRepository.getFollowing(
      userId,
      limit + 1,
      requestingUserId,
      cursor,
    );

    const hasMore = data.length > limit;
    const finalData = hasMore ? data.slice(0, limit) : data;

    return {
      data: finalData,
      nextCursor: hasMore ? finalData[finalData.length - 1]._id : null,
      hasMore,
    };
  }

  async getMutualFollowers(
    targetUserId: string,
    limit: number,
    requestingUserId: string,
    cursor?: string,
  ) {
    const data = await this.followsRepository.getMutualFollowers(
      targetUserId,
      requestingUserId,
      limit + 1,
      cursor,
    );

    const hasMore = data.length > limit;
    const finalData = hasMore ? data.slice(0, limit) : data;

    return {
      data: finalData,
      nextCursor: hasMore ? finalData[finalData.length - 1]._id : null,
      hasMore,
    };
  }

  async getFollowStatus(currentUserId: string, targetUserId: string) {
    const following = await this.followsRepository.findRelation(currentUserId, targetUserId);
    const followedBy = await this.followsRepository.findRelation(targetUserId, currentUserId);

    return {
      isFollowing: !!following && following.status === 'active',
      isFollowedBy: !!followedBy && followedBy.status === 'active',
      isPending: following?.status === 'pending',
    };
  }

  async removeFollower(currentUserId: string, targetUserId: string) {
    const relation = await this.followsRepository.deleteRelation(
      targetUserId, // Follower to remove
      currentUserId, // You are being followed
    );

    if (!relation) {
      throw new NotFoundException('Follower not found');
    }

    if (relation.status === 'active') {
      await this.usersRepository.update(currentUserId, { $inc: { followersCount: -1 } });
      await this.usersRepository.update(targetUserId, { $inc: { followingCount: -1 } });
    }

    return { message: 'Follower removed successfully' };
  }

  async getPendingRequests(userId: string, limit: number, cursor?: string) {
    const requests = await this.followsRepository.getPendingRequests(userId, limit + 1, cursor);
    const hasMore = requests.length > limit;
    const rawData = hasMore ? requests.slice(0, limit) : requests;

    const data = rawData.map(f => {
      const follow = f.toObject();
      const user = follow.follower_id;
      return {
        _id: follow._id, // Relation ID
        userId: (user as any)._id, // Explicit User ID
        username: (user as any).username,
      };
    });

    return { data, nextCursor: hasMore ? data[data.length - 1]._id : null, hasMore };
  }

  async getSentRequests(userId: string, limit: number, cursor?: string) {
    const requests = await this.followsRepository.getSentRequests(userId, limit + 1, cursor);
    const hasMore = requests.length > limit;
    const rawData = hasMore ? requests.slice(0, limit) : requests;

    const data = rawData.map(f => {
      const follow = f.toObject();
      const user = follow.following_id;
      return {
        _id: follow._id, // Relation ID
        userId: (user as any)._id, // Explicit User ID
        username: (user as any).username,
      };
    });

    return { data, nextCursor: hasMore ? data[data.length - 1]._id : null, hasMore };
  }
}