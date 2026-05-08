import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Follow,
  FollowSchema,
} from './schemas/follow.schema';

import { FollowsController } from './follows.controller';
import { FollowsService } from './follows.service';
import { FollowsRepository } from './follows.repository';

import { UsersModule } from '../users/users.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Follow.name,
        schema: FollowSchema,
      },
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [FollowsController],
  providers: [
    FollowsService,
    FollowsRepository,
  ],
  exports: [FollowsService],
})
export class FollowsModule {}