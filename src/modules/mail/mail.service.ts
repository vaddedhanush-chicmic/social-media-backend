import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendUserVerification(email: string, token: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to Social Media App! Verify your Email',
      template: './verification',
      context: {
        token,
      },
    });
  }

  async sendPasswordReset(email: string, token: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Password Reset Request',
      template: './reset-password',
      context: {
        token,
      },
    });
  }
}
