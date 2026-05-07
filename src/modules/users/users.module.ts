import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { User, UserSchema } from './schemas/user.schema';
import { Profile, ProfileSchema } from './schemas/profile.schema';

import { RedisModule } from '../../database/redis.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Profile.name, schema: ProfileSchema },
    ]),
    RedisModule,
    JwtModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository, MongooseModule],
})
export class UsersModule {}
