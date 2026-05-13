import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostQueryDto } from './dto/post-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { multerConfig } from '../upload/multer.config';

@ApiTags('Posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // ── Create ────────────────────────────────────────────────────────────────

  @Post('posts')
  @UseInterceptors(FileInterceptor('file', multerConfig()))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new post' })
  createPost(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreatePostDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.postsService.createPost(userId, dto, file);
  }

  // ── Feed ──────────────────────────────────────────────────────────────────

  @Get('posts/feed')
  @ApiOperation({ summary: 'Get paginated feed of followed users' })
  getFeed(
    @CurrentUser('userId') userId: string,
    @Query() query: PostQueryDto,
  ) {
    return this.postsService.getFeed(userId, query);
  }

  // ── Single post ───────────────────────────────────────────────────────────

  @Get('posts/:postId')
  @Public()
  @ApiOperation({ summary: 'Get a post by ID' })
  getPost(
    @Param('postId') postId: string,
    @CurrentUser('userId') userId?: string,
  ) {
    return this.postsService.getPost(postId, userId);
  }

  @Patch('posts/:postId')
  @ApiOperation({ summary: 'Update caption or visibility of a post' })
  updatePost(
    @Param('postId') postId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.updatePost(postId, userId, dto);
  }

  @Delete('posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a post' })
  deletePost(
    @Param('postId') postId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.postsService.deletePost(postId, userId);
  }

  @Patch('posts/:postId/archive')
  @ApiOperation({ summary: 'Archive a post' })
  archivePost(
    @Param('postId') postId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.postsService.archivePost(postId, userId);
  }

  // ── User posts ────────────────────────────────────────────────────────────

  @Get('users/:userId/posts')
  @Public()
  @ApiOperation({ summary: 'Get paginated posts for a user profile' })
  getUserPosts(
    @Param('userId') profileUserId: string,
    @Query() query: PostQueryDto,
    @CurrentUser('userId') requesterId?: string,
  ) {
    return this.postsService.getUserPosts(profileUserId, requesterId, query);
  }

  // ── Likes ─────────────────────────────────────────────────────────────────

  @Post('posts/:postId/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Like a post' })
  likePost(
    @Param('postId') postId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.postsService.likePost(postId, userId);
  }

  @Delete('posts/:postId/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unlike a post' })
  unlikePost(
    @Param('postId') postId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.postsService.unlikePost(postId, userId);
  }
}