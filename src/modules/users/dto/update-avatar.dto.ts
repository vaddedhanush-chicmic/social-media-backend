import { IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAvatarDto {
  @ApiProperty({ example: 'https://example.com/avatar.jpg', description: 'The new avatar URL' })
  @IsUrl()
  @IsNotEmpty()
  avatarUrl: string;
}
