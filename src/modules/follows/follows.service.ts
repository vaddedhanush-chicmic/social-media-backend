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
      await this.usersRepository.update(currentUserId, { $inc: { followingCount: 1 } });
      await this.usersRepository.update(targetUserId, { $inc: { followersCount: 1 } });
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
      await this.usersRepository.update(currentUserId, { $inc: { followingCount: -1 } });
      await this.usersRepository.update(targetUserId, { $inc: { followersCount: -1 } });
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

    await this.usersRepository.update(requesterId, { $inc: { followingCount: 1 } });
    await this.usersRepository.update(currentUserId, { $inc: { followersCount: 1 } });

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
    if (userId !== requestingUserId) {
      const user = await this.usersRepository.findById(userId);
      if (user?.isPrivate) {
        const relation = await this.followsRepository.findRelation(requestingUserId, userId);
        if (!relation || relation.status !== 'active') {
          throw new ForbiddenException('This account is private. Follow to see their followers.');
        }
      }
    }

    const followers = await this.followsRepository.getFollowers(userId, limit + 1, cursor);
    const hasMore = followers.length > limit;
    const rawData = hasMore ? followers.slice(0, limit) : followers;
    
    const data = rawData.map(f => {
      const follow = f.toObject();
      const user = follow.follower_id;
      return {
        _id: follow._id,
        ...(typeof user === 'object' ? user : {}),
      };
    });

    return { data, nextCursor: hasMore ? data[data.length - 1]._id : null, hasMore };
  }

  async getFollowing(
    userId: string,
    limit: number,
    requestingUserId: string,
    cursor?: string,
  ) {
    // Privacy Check
    if (userId !== requestingUserId) {
      const user = await this.usersRepository.findById(userId);
      if (user?.isPrivate) {
        const relation = await this.followsRepository.findRelation(requestingUserId, userId);
        if (!relation || relation.status !== 'active') {
          throw new ForbiddenException('This account is private. Follow to see who they follow.');
        }
      }
    }

    const following = await this.followsRepository.getFollowing(userId, limit + 1, cursor);
    const hasMore = following.length > limit;
    const rawData = hasMore ? following.slice(0, limit) : following;

    const data = rawData.map(f => {
      const follow = f.toObject();
      const user = follow.following_id;
      return {
        _id: follow._id,
        ...(typeof user === 'object' ? user : {}),
      };
    });

    return { data, nextCursor: hasMore ? data[data.length - 1]._id : null, hasMore };
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

  getPendingRequests(userId: string) {
    return this.followsRepository.getPendingRequests(userId);
  }
}