import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UserDocument } from './schemas/user.schema';
import { ProfileDocument } from './schemas/profile.schema';
import { RedisService } from '../../database/redis.service';
import { JwtService } from '@nestjs/jwt';
import { FollowsService } from '../follows/follows.service';

@Injectable()
export class UsersService {
  constructor(
    private usersRepository: UsersRepository,
    private redisService: RedisService,
    private jwtService: JwtService,
    @Inject(forwardRef(() => FollowsService))
    private followsService: FollowsService,
  ) {}

  async create(userData: any): Promise<UserDocument> {
    return this.usersRepository.create(userData);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.usersRepository.findById(id);
  }

  async findByEmailOrUsername(email: string, username: string): Promise<UserDocument | null> {
    return this.usersRepository.findByEmailOrUsername(email, username);
  }

  async update(id: string, updateData: any): Promise<UserDocument | null> {
    return this.usersRepository.update(id, updateData);
  }

  async delete(id: string): Promise<any> {
    await this.usersRepository.deleteProfile(id);
    return this.usersRepository.delete(id);
  }

  // Profile Management
  async createProfile(userId: string, profileData: any): Promise<ProfileDocument> {
    const existingProfile = await this.usersRepository.findProfileByUserId(userId);
    if (existingProfile) {
      throw new ConflictException('Profile already exists for this user');
    }

    return this.usersRepository.createProfile({
      ...profileData,
      userId: userId as any,
      isComplete: true,
    });
  }

  async getProfile(userId: string): Promise<ProfileDocument> {
    const profile = await this.usersRepository.findProfileByUserId(userId, 'username email');
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async updateProfile(userId: string, updateData: any): Promise<ProfileDocument> {
    const profile = await this.usersRepository.updateProfile(userId, updateData);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async findByUsername(username: string, requestingUserId?: string): Promise<any> {
    const user = await this.usersRepository.findActiveByUsername(username);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isOwnProfile = user._id.toString() === requestingUserId;
    let isFollowing = false;

    if (!isOwnProfile && requestingUserId) {
      const status = await this.followsService.getFollowStatus(requestingUserId, user._id.toString());
      isFollowing = status.isFollowing && !status.isPending;
    }

    const isPrivate = user.isPrivate && !isOwnProfile && !isFollowing;
    
    // Privacy Logic: Hide certain fields if account is private and not following
    const userFields = isOwnProfile ? 'username email isPrivate followersCount followingCount' : 'username isPrivate followersCount followingCount -_id';
    
    // If private, hide bio and other profile details
    const profileFields = isPrivate ? '-__v -isComplete -updatedAt -bio -socialLinks' : '-__v -isComplete -updatedAt';

    const profile = await this.usersRepository.findProfileByUserId(
      user._id.toString(), 
      userFields, 
      profileFields
    );
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return {
      ...profile.toObject(),
      isFollowing,
      canViewFullProfile: !isPrivate,
    };
  }

  async softDelete(id: string): Promise<any> {
    return this.usersRepository.update(id, { deletedAt: new Date(), isActive: false });
  }

  async deactivate(id: string, token?: string): Promise<any> {
    if (token) {
      const decoded: any = this.jwtService.decode(token);
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await this.redisService.blacklistToken(token, ttl);
        }
      }
    }
    return this.usersRepository.update(id, { isActive: false, deactivatedAt: new Date() });
  }

  async reactivate(id: string): Promise<any> {
    return this.usersRepository.update(id, { isActive: true, deactivatedAt: null });
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<ProfileDocument> {
    return this.updateProfile(userId, { avatarUrl });
  }

  async removeAvatar(userId: string): Promise<ProfileDocument> {
    const profile = await this.usersRepository.findProfileByUserId(userId);
    if (!profile?.avatarUrl) {
      throw new BadRequestException('User does not have an avatar');
    }

    // Note: In the next phase, we will add Cloud Storage (S3/Cloudinary) file deletion here
    return this.updateProfile(userId, { avatarUrl: null });
  }

  async searchUsers(query: string) {
    return this.usersRepository.search(query);
  }
}
