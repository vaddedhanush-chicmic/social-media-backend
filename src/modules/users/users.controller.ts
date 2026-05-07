import { Controller, Get, Post, Patch, Delete, Body, Query, Param, UseGuards, Req } from '@nestjs/common';
import * as express from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('profile')
  @ApiOperation({ summary: 'Create user profile' })
  async createProfile(
    @CurrentUser('userId') userId: string,
    @Body() profileData: CreateProfileDto,
  ) {
    return this.usersService.createProfile(userId, profileData);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get own profile' })
  async getMe(@CurrentUser('userId') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own profile' })
  async updateMe(
    @CurrentUser('userId') userId: string,
    @Body() updateData: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, updateData);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Soft-delete account' })
  async softDelete(@CurrentUser('userId') userId: string) {
    return this.usersService.softDelete(userId);
  }

  @Post('me/avatar')
  @ApiOperation({ summary: 'Update avatar' })
  async updateAvatar(
    @CurrentUser('userId') userId: string,
    @Body() updateAvatarDto: UpdateAvatarDto,
  ) {
    return this.usersService.updateAvatar(userId, updateAvatarDto.avatarUrl);
  }

  @Delete('me/avatar')
  @ApiOperation({ summary: 'Remove avatar' })
  async removeAvatar(@CurrentUser('userId') userId: string) {
    return this.usersService.removeAvatar(userId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users' })
  async search(@Query() searchUserDto: SearchUserDto) {
    return this.usersService.searchUsers(searchUserDto.query);
  }

  @Public()
  @Get(':username')
  @ApiOperation({ summary: 'View public profile' })
  async getPublicProfile(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }

  @Post('deactivate')
  @ApiOperation({ summary: 'Temporarily deactivate account' })
  async deactivate(
    @CurrentUser('userId') userId: string,
    @Req() req: express.Request,
  ) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.usersService.deactivate(userId, token);
  }
}
