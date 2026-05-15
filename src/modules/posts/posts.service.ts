import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PostsRepository } from './posts.repository';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostQueryDto } from './dto/post-query.dto';
import { PostDocument, PostVisibility, PostMediaType } from './schemas/post.schema';
import { UploadService } from '../upload/upload.service';
import { UploadContext } from '../upload/upload.constants';
import { UsersService } from '../users/users.service';
import { FollowsService } from '../follows/follows.service';

const DEFAULT_LIMIT = 10;

@Injectable()
export class PostsService {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly uploadService: UploadService,
    private readonly usersService: UsersService,
    private readonly followsService: FollowsService,
  ) {}

  // ── Create ────────────────────────────────────────────────────────────────

  async createPost(
    authorId: string,
    dto: CreatePostDto,
    file?: Express.Multer.File,
  ): Promise<PostDocument> {
    const mediaType = dto.mediaType ?? this.inferMediaType(file);

    if (mediaType !== PostMediaType.TEXT && !file) {
      throw new BadRequestException('A media file is required for image and video posts.');
    }

    let media: { url: string; mimeType: string; size: number; originalName: string }[] = [];

    if (file) {
      const uploaded = await this.uploadService.saveFile(file, UploadContext.POST, authorId);
      media = [{
        url: uploaded.url,
        mimeType: uploaded.mimeType,
        size: uploaded.size,
        originalName: file.originalname,
      }];
    }

    const post = await this.postsRepository.create({
      authorId: authorId as any,
      caption: dto.caption ?? null,
      visibility: dto.visibility ?? PostVisibility.PUBLIC,
      mediaType,
      media,
    });

    await this.usersService.update(authorId, { $inc: { postsCount: 1 } });
    return post;
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  async getPost(postId: string, requesterId?: string): Promise<PostDocument> {
    const post = await this.findOrThrow(postId);
    await this.assertCanView(post, requesterId);
    return post;
  }

  async getUserPosts(
    profileUserId: string,
    requesterId: string | undefined,
    query: PostQueryDto,
  ): Promise<{ data: PostDocument[]; nextCursor: string | null }> {
    const limit = query.limit ?? DEFAULT_LIMIT;

    await this.usersService.findById(profileUserId);

    let canSeeFollowerPosts = false;
    if (requesterId) {
      if (requesterId === profileUserId) {
        canSeeFollowerPosts = true;
      } else {
        const status = await this.followsService.getFollowStatus(requesterId, profileUserId);
        canSeeFollowerPosts = status.isFollowing;
      }
    }

    const posts = await this.postsRepository.findByAuthor(profileUserId, limit + 1, query.cursor);

    const filtered = canSeeFollowerPosts
      ? posts
      : posts.filter((p) => p.visibility === PostVisibility.PUBLIC);

    return this.paginateResult(filtered, limit);
  }

  async getFeed(
    requesterId: string,
    query: PostQueryDto,
  ): Promise<{ data: PostDocument[]; nextCursor: string | null }> {
    const limit = query.limit ?? DEFAULT_LIMIT;

    // getFollowing returns paginated results; fetch up to 1000 to build a feed
    const { data: following } = await this.followsService.getFollowing(
      requesterId,
      1000,
      requesterId,
    );
    const followingIds = following.map((f: any) => f.userId?.toString() ?? f._id?.toString());
    const authorIds = [...followingIds, requesterId];

    const posts = await this.postsRepository.findFeed(authorIds, limit + 1, query.cursor);
    return this.paginateResult(posts, limit);
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async updatePost(
    postId: string,
    requesterId: string,
    dto: UpdatePostDto,
  ): Promise<PostDocument> {
    const post = await this.findOrThrow(postId);
    this.assertOwner(post, requesterId);
    const updated = await this.postsRepository.update(postId, dto);
    if (!updated) throw new NotFoundException('Post not found.');
    return updated;
  }

  async archivePost(postId: string, requesterId: string): Promise<PostDocument> {
    const post = await this.findOrThrow(postId);
    this.assertOwner(post, requesterId);
    const updated = await this.postsRepository.update(postId, { isArchived: true });
    if (!updated) throw new NotFoundException('Post not found.');
    return updated;
  }

  async unarchivePost(postId: string, requesterId: string): Promise<PostDocument> {
    const post = await this.findOrThrow(postId);
    this.assertOwner(post, requesterId);
    const updated = await this.postsRepository.update(postId, { isArchived: false });
    if (!updated) throw new NotFoundException('Post not found.');
    return updated;
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async deletePost(postId: string, requesterId: string): Promise<void> {
    const post = await this.findOrThrow(postId);
    this.assertOwner(post, requesterId);

    if (post.media?.length) {
      post.media.forEach((m) => this.uploadService.deleteFileByUrl(m.url));
    }

    await this.postsRepository.softDelete(postId);
    await this.usersService.update(requesterId, { $inc: { postsCount: -1 } });
  }

  // ── Likes ─────────────────────────────────────────────────────────────────

  async likePost(postId: string, requesterId: string): Promise<void> {
    const post = await this.findOrThrow(postId);
    await this.assertCanView(post, requesterId);
    await this.postsRepository.incrementLikes(postId);
  }

  async unlikePost(postId: string, requesterId: string): Promise<void> {
    const post = await this.findOrThrow(postId);
    await this.assertCanView(post, requesterId);
    await this.postsRepository.decrementLikes(postId);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async findOrThrow(postId: string): Promise<PostDocument> {
    const post = await this.postsRepository.findById(postId);
    if (!post) throw new NotFoundException('Post not found.');
    return post;
  }

  private assertOwner(post: PostDocument, requesterId: string): void {
    if (post.authorId.toString() !== requesterId) {
      throw new ForbiddenException('You do not have permission to modify this post.');
    }
  }

  private async assertCanView(post: PostDocument, requesterId?: string): Promise<void> {
    if (post.visibility === PostVisibility.PUBLIC) return;

    if (!requesterId) {
      throw new ForbiddenException('This post is restricted.');
    }

    const authorId = post.authorId.toString();
    if (requesterId === authorId) return;

    const status = await this.followsService.getFollowStatus(requesterId, authorId);
    if (!status.isFollowing) {
      throw new ForbiddenException('This post is restricted to followers.');
    }
  }

  private paginateResult(
    posts: PostDocument[],
    limit: number,
  ): { data: PostDocument[]; nextCursor: string | null } {
    const hasMore = posts.length > limit;
    const data = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? data[data.length - 1]._id.toString() : null;
    return { data, nextCursor };
  }

  private inferMediaType(file?: Express.Multer.File): PostMediaType {
    if (!file) return PostMediaType.TEXT;
    if (file.mimetype.startsWith('video/')) return PostMediaType.VIDEO;
    return PostMediaType.IMAGE;
  }
}