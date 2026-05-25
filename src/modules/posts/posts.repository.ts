import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { Like, LikeDocument } from './schemas/like.schema';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
  ) {}

  async create(data: Partial<Post>): Promise<PostDocument> {
    const post = new this.postModel(data);
    return post.save();
  }

  async findById(postId: string): Promise<PostDocument | null> {
    return this.postModel
      .findOne({ _id: postId, deletedAt: null })
      .populate('authorId', 'username isPremium')
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
  ): Promise<any[]> {
    const matchStage: any = {
      authorId: { $in: followingIds.map(id => new Types.ObjectId(id)) },
      deletedAt: null,
      isArchived: false,
    };

    if (cursor) {
      matchStage._id = { $lt: new Types.ObjectId(cursor) };
    }

    return this.postModel.aggregate([
      { $match: matchStage },
      { $sort: { _id: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'author',
          pipeline: [
            { $project: { username: 1, isPremium: 1 } },
          ],
        },
      },
      {
        $lookup: {
          from: 'profiles',
          localField: 'authorId',
          foreignField: 'userId',
          as: 'authorProfile',
          pipeline: [
            { $project: { avatarUrl: 1, fullName: 1 } },
          ],
        },
      },
      {
        $addFields: {
          author: { $arrayElemAt: ['$author', 0] },
          authorProfile: { $arrayElemAt: ['$authorProfile', 0] },
        },
      },
    ]);
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

  async addLike(postId: string, userId: string): Promise<boolean> {
    try {
      await this.likeModel.create({
        postId: new Types.ObjectId(postId),
        userId: new Types.ObjectId(userId),
      });
      await this.postModel
        .findByIdAndUpdate(postId, { $inc: { likesCount: 1 } })
        .exec();
      return true; // like was added
    } catch (err: any) {
      // Duplicate key error (code 11000) means already liked — idempotent no-op
      if (err.code === 11000) return false;
      throw err;
    }
  }

  async removeLike(postId: string, userId: string): Promise<boolean> {
    const result = await this.likeModel.deleteOne({
      postId: new Types.ObjectId(postId),
      userId: new Types.ObjectId(userId),
    }).exec();

    if (result.deletedCount === 0) return false; // wasn't liked

    await this.postModel
      .findOneAndUpdate(
        { _id: postId, likesCount: { $gt: 0 } },
        { $inc: { likesCount: -1 } },
      )
      .exec();
    return true; // like was removed
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