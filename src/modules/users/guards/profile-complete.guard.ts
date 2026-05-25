import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
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
      // Profile doesn't exist yet — treat as incomplete
      if (error instanceof NotFoundException) {
        throw new ForbiddenException('Please complete your profile to access this feature');
      }
      // Any other error (DB failure, etc.) should propagate with the real status code
      throw error;
    }
  }
}
