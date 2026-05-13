import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as express from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePrivacyDto } from './dto/update-privacy.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { UploadService } from '../upload/upload.service';
import { UploadContext } from '../upload/upload.constants';
import { multerConfig } from '../upload/multer.config';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private uploadService: UploadService,
  ) {}

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

  // ─── File Upload ──────────────────────────────────────────────────────────

  /**
   * POST /users/me/fileupload?type=avatar
   *
   * Saves file to disk (uploads/avatars/<uuid>.ext) and stores the public URL
   * in the profile document. Old avatar file is deleted from disk automatically.
   */
  @Post('me/fileupload')
  @UseInterceptors(FileInterceptor('file', multerConfig()))
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'type',
    enum: ['avatar'],
    required: true,
    description: 'The type of file being uploaded',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Upload a user file (avatar, etc.)' })
  async uploadFile(
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (type === 'avatar') {
      const profile = await this.usersService.getProfile(userId);
      const oldUrl: string | undefined = (profile as any).avatarUrl;

      const { url, size, mimeType } = await this.uploadService.saveFile(
        file,
        UploadContext.AVATAR,
        userId,
      );

      await this.usersService.updateAvatar(userId, url);

      if (oldUrl) {
        this.uploadService.deleteFileByUrl(oldUrl);
      }

      return { message: 'Avatar updated successfully', url, mimeType, size, type };
    }

    throw new BadRequestException(`Unsupported upload type: "${type}"`);
  }

  /**
   * DELETE /users/me/fileupload?type=avatar
   *
   * Removes the file from disk and clears the URL from the profile document.
   */
  @Delete('me/fileupload')
  @ApiQuery({
    name: 'type',
    enum: ['avatar'],
    required: true,
    description: 'The type of file to remove',
  })
  @ApiOperation({ summary: 'Remove uploaded file (e.g. avatar)' })
  async removeFile(
    @CurrentUser('userId') userId: string,
    @Query('type') type: string,
  ) {
    if (type === 'avatar') {
      const profile = await this.usersService.getProfile(userId);
      const oldUrl: string | undefined = (profile as any).avatarUrl;

      const result = await this.usersService.removeAvatar(userId);

      if (oldUrl) {
        this.uploadService.deleteFileByUrl(oldUrl);
      }

      return result;
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
