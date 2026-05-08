import { Injectable, ConflictException, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as express from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { RedisService } from '../../database/redis.service';
import { MailService } from '../mail/mail.service';
import { UsersRepository } from '../users/users.repository';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private mailService: MailService,
    private usersRepository: UsersRepository,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, username, password } = registerDto;

    const existingUser = await this.usersService.findByEmailOrUsername(email, username);
    if (existingUser) {
      if (!existingUser.isEmailVerified) {
        // Delete unverified user to allow re-registration
        await this.usersService.delete(existingUser._id.toString());
      } else {
        throw new ConflictException('User with this email or username already exists');
      }
    }

    const hashedPassword = await this.hashData(password);
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      verificationToken,
    });

    await this.mailService.sendUserVerification(user.email, verificationToken);

    return {
      message: 'Registration successful. Please verify your email.',
      userId: user._id,
    };
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    if (user.deletedAt) {
      throw new ForbiddenException('This account has been deleted.');
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException('Please verify your email before logging in.');
    }

    if (await bcrypt.compare(pass, user.password)) {
      // If account was deactivated, reactivate it automatically
      if (!user.isActive) {
        await this.usersService.reactivate(user._id.toString());
      }
      
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any) {
    const accessToken = await this.getAccessToken(user._id.toString(), user.email, user.username);
    const profile = await this.usersRepository.findProfileByUserId(user._id.toString());
    
    return {
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        isProfileComplete: profile ? profile.isComplete : false,
      },
      accessToken,
    };
  }

  async logout(token: string) {
    const decoded: any = this.jwtService.decode(token);
    const exp = decoded.exp;
    const now = Math.floor(Date.now() / 1000);
    const ttl = exp - now;

    if (ttl > 0) {
      await this.redisService.blacklistToken(token, ttl);
    }
    return { message: 'Logged out successfully' };
  }

  async verifyEmail(email: string, token: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || user.verificationToken !== token) {
      throw new UnauthorizedException('Invalid verification token');
    }

    await this.usersService.update(user._id.toString(), {
      isEmailVerified: true,
      verificationToken: null,
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerification(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');
    if (user.isEmailVerified) throw new ConflictException('Email already verified');

    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    await this.usersService.update(user._id.toString(), { verificationToken });

    await this.mailService.sendUserVerification(user.email, verificationToken);
    return { message: 'Verification token resent' };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const resetToken = Math.random().toString(36).slice(-8);
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    await this.usersService.update(user._id.toString(), {
      resetPasswordToken: resetToken,
      resetPasswordExpires: expires,
    });

    await this.mailService.sendPasswordReset(user.email, resetToken);
    return { message: 'Password reset token sent to email' };
  }

  async verifyResetToken(token: string, response: express.Response) {
    const user = await this.usersRepository.findByResetToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Store token in httpOnly cookie - JS cannot read this
    response.cookie('reset_session', token, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 600000, // 10 minutes
    });

    return { message: 'Reset token is valid' };
  }

  async resetPassword(token: string, resetPasswordDto: any, response: express.Response) {
    if (!token) {
      throw new UnauthorizedException('No reset session found. Please verify your token first.');
    }

    const { password, confirmPassword } = resetPasswordDto;
    
    if (password !== confirmPassword) {
      throw new ConflictException('Passwords do not match');
    }

    const user = await this.usersRepository.findByResetToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const hashedPassword = await this.hashData(password);
    await this.usersService.update(user._id.toString(), {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    // Clear the cookie after successful reset
    response.clearCookie('reset_session');

    return { message: 'Password reset successful' };
  }

  async changePassword(userId: string, changePasswordDto: any) {
    const { oldPassword, newPassword } = changePasswordDto;
    const user = await this.usersService.findById(userId);
    
    if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
      throw new UnauthorizedException('Invalid old password');
    }

    const hashedNewPassword = await this.hashData(newPassword);
    await this.usersService.update(userId, { password: hashedNewPassword });
    
    return { message: 'Password changed successfully' };
  }

  async hashData(data: string) {
    return bcrypt.hash(data, 10);
  }

  async getAccessToken(userId: string, email: string, username: string) {
    return this.jwtService.signAsync(
      {
        sub: userId,
        email,
        username,
      },
      {
        secret: this.configService.get<string>('jwt.accessSecret') || 'secret',
        expiresIn: (this.configService.get<string>('jwt.accessExpiration') || '1d') as any,
      },
    );
  }
}
