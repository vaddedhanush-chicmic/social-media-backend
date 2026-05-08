import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyResetTokenDto {
  @ApiProperty({ example: 'your-reset-token', description: 'The token sent to your email' })
  @IsString()
  @IsNotEmpty()
  token: string;
}
