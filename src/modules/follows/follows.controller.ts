import {
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query,
    Req,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FollowsService } from './follows.service';
import { FollowQueryDto } from './dto/follow-query.dto';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('follows')
@ApiBearerAuth()
@Controller('follows')
@UseGuards(JwtAuthGuard)
export class FollowsController {
    constructor(private readonly followsService: FollowsService) { }

    @Post(':userId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Follow a user' })
    @ApiParam({ name: 'userId', description: 'ID of the user to follow' })
    follow(
        @CurrentUser('userId') currentUserId: string,
        @Param('userId', ParseObjectIdPipe) targetUserId: string,
    ) {
        return this.followsService.followUser(currentUserId, targetUserId);
    }

    @Delete(':userId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Unfollow a user' })
    @ApiParam({ name: 'userId', description: 'ID of the user to unfollow' })
    unfollow(
        @CurrentUser('userId') currentUserId: string,
        @Param('userId', ParseObjectIdPipe) targetUserId: string,
    ) {
        return this.followsService.unfollowUser(currentUserId, targetUserId);
    }

    @Post(':userId/accept')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Accept a follow request' })
    @ApiParam({ name: 'userId', description: 'ID of the user who sent the request' })
    accept(
        @CurrentUser('userId') currentUserId: string,
        @Param('userId', ParseObjectIdPipe) requesterId: string,
    ) {
        return this.followsService.acceptRequest(currentUserId, requesterId);
    }

    @Delete(':userId/reject')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reject a follow request' })
    @ApiParam({ name: 'userId', description: 'ID of the user who sent the request' })
    reject(
        @CurrentUser('userId') currentUserId: string,
        @Param('userId', ParseObjectIdPipe) requesterId: string,
    ) {
        return this.followsService.rejectRequest(currentUserId, requesterId);
    }

    @Get(':userId/followers')
    @ApiOperation({ summary: 'Get followers of a user' })
    followers(
        @CurrentUser('userId') currentUserId: string,
        @Param('userId', ParseObjectIdPipe) userId: string,
        @Query() query: FollowQueryDto,
    ) {
        return this.followsService.getFollowers(
            userId,
            query.limit || 10,
            currentUserId,
            query.cursor,
        );
    }

    @Get(':userId/following')
    @ApiOperation({ summary: 'Get users followed by a user' })
    following(
        @CurrentUser('userId') currentUserId: string,
        @Param('userId', ParseObjectIdPipe) userId: string,
        @Query() query: FollowQueryDto,
    ) {
        return this.followsService.getFollowing(
            userId,
            query.limit || 10,
            currentUserId,
            query.cursor,
        );
    }

    @Get(':userId/status')
    @ApiOperation({ summary: 'Check follow status between current user and target user' })
    status(
        @CurrentUser('userId') currentUserId: string,
        @Param('userId', ParseObjectIdPipe) targetUserId: string,
    ) {
        return this.followsService.getFollowStatus(currentUserId, targetUserId);
    }

    @Get(':userId/mutuals')
    @ApiOperation({ summary: 'Get mutual followers' })
    mutuals(
        @CurrentUser('userId') currentUserId: string,
        @Param('userId', ParseObjectIdPipe) targetUserId: string,
        @Query() query: FollowQueryDto,
    ) {
        return this.followsService.getMutualFollowers(
            targetUserId,
            query.limit || 10,
            currentUserId,
            query.cursor,
        );
    }

    @Delete(':userId/remove')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Silently remove a follower' })
    @ApiParam({ name: 'userId', description: 'ID of the follower to remove' })
    remove(
        @CurrentUser('userId') currentUserId: string,
        @Param('userId', ParseObjectIdPipe) targetUserId: string,
    ) {
        return this.followsService.removeFollower(currentUserId, targetUserId);
    }

    @Get('requests/pending')
    @ApiOperation({ summary: 'Get incoming pending follow requests' })
    pending(
        @CurrentUser('userId') currentUserId: string,
        @Query() query: FollowQueryDto,
    ) {
        return this.followsService.getPendingRequests(
            currentUserId,
            query.limit || 10,
            query.cursor,
        );
    }

    @Get('requests/sent')
    @ApiOperation({ summary: 'Get outgoing pending follow requests' })
    sent(
        @CurrentUser('userId') currentUserId: string,
        @Query() query: FollowQueryDto,
    ) {
        return this.followsService.getSentRequests(
            currentUserId,
            query.limit || 10,
            query.cursor,
        );
    }
}