import { Controller, Get, Post, Patch, Delete, Body, Query, Param, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as express from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePrivacyDto } from './dto/update-privacy.dto';
import { SearchUserDto } from './dto/search-user.dto';

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

  @Patch('me/privacy')
  @ApiOperation({ summary: 'Toggle account privacy (Public/Private)' })
  async updatePrivacy(
    @CurrentUser('userId') userId: string,
    @Body() updatePrivacyDto: UpdatePrivacyDto,
  ) {
    return this.usersService.updatePrivacy(userId, updatePrivacyDto.isPrivate);
  }

  @Post('me/fileupload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'type', enum: ['avatar'], required: true, description: 'The type of file being uploaded' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Universal file upload' })
  async uploadFile(
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Note: we will add Cloud Storage (S3/Cloudinary) here
    const mockUrl = `https://storage.com/uploads/${Date.now()}-${file.originalname}`;

    if (type === 'avatar') {
      await this.usersService.updateAvatar(userId, mockUrl);
      return { 
        message: 'Avatar updated successfully', 
        url: mockUrl,
        type 
      };
    }

    return { 
      message: 'File uploaded successfully (Generic)', 
      type, 
      fileName: file.originalname 
    };
  }

  @Delete('me/fileupload')
  @ApiQuery({ name: 'type', enum: ['avatar'], required: true, description: 'The type of file to remove' })
  @ApiOperation({ summary: 'Remove uploaded file (e.g. avatar)' })
  async removeFile(
    @CurrentUser('userId') userId: string,
    @Query('type') type: string,
  ) {
    if (type === 'avatar') {
      return this.usersService.removeAvatar(userId);
    }
    throw new BadRequestException('Invalid file type for removal');
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users' })
  async search(@Query() searchUserDto: SearchUserDto) {
    return this.usersService.searchUsers(searchUserDto.query);
  }

  @Get(':username')
  @ApiOperation({ summary: 'View profile (Self or Public)' })
  async getProfile(
    @Param('username') username: string,
    @CurrentUser('userId') userId?: string,
  ) {
    return this.usersService.findByUsername(username, userId);
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
