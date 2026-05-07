import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../users.service';

@Injectable()
export class ProfileCompleteGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      throw new ForbiddenException('User not authenticated');
    }

    try {
      const profile = await this.usersService.getProfile(user.userId);
      if (!profile || !profile.isComplete) {
        throw new ForbiddenException('Please complete your profile to access this feature');
      }
      return true;
    } catch (error) {
      throw new ForbiddenException('Please complete your profile to access this feature');
    }
  }
}
