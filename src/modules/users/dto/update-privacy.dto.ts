import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdatePrivacyDto {
  @ApiProperty({ example: true, description: 'Set account to private or public' })
  @IsBoolean()
  isPrivate: boolean;
}
