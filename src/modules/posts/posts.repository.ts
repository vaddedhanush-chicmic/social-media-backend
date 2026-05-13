import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ) {}

  async create(data: Partial<Post>): Promise<PostDocument> {
    const post = new this.postModel(data);
    return post.save();
  }

  async findById(postId: string): Promise<PostDocument | null> {
    return this.postModel
      .findOne({ _id: postId, deletedAt: null })
      .exec();
  }

  async findByAuthor(
    authorId: string,
    limit: number,
    cursor?: string,
  ): Promise<PostDocument[]> {
    const query: any = {
      authorId: new Types.ObjectId(authorId),
      deletedAt: null,
      isArchived: false,
    };

    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    return this.postModel
      .find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .exec();
  }

  async findFeed(
    followingIds: string[],
    limit: number,
    cursor?: string,
  ): Promise<PostDocument[]> {
    const query: any = {
      authorId: { $in: followingIds.map(id => new Types.ObjectId(id)) },
      deletedAt: null,
      isArchived: false,
    };

    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    return this.postModel
      .find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .populate('authorId', 'username')
      .exec();
  }

  async update(postId: string, data: Partial<Post>): Promise<PostDocument | null> {
    return this.postModel
      .findOneAndUpdate({ _id: postId, deletedAt: null }, data, { returnDocument: 'after' })
      .exec();
  }

  async softDelete(postId: string): Promise<PostDocument | null> {
    return this.postModel
      .findOneAndUpdate(
        { _id: postId, deletedAt: null },
        { deletedAt: new Date() },
        { returnDocument: 'after' },
      )
      .exec();
  }

  async incrementLikes(postId: string): Promise<void> {
    await this.postModel
      .findByIdAndUpdate(postId, { $inc: { likesCount: 1 } })
      .exec();
  }

  async decrementLikes(postId: string): Promise<void> {
    await this.postModel
      .findOneAndUpdate(
        { _id: postId, likesCount: { $gt: 0 } },
        { $inc: { likesCount: -1 } },
      )
      .exec();
  }

  async incrementComments(postId: string): Promise<void> {
    await this.postModel
      .findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } })
      .exec();
  }

  async decrementComments(postId: string): Promise<void> {
    await this.postModel
      .findOneAndUpdate(
        { _id: postId, commentsCount: { $gt: 0 } },
        { $inc: { commentsCount: -1 } },
      )
      .exec();
  }
}