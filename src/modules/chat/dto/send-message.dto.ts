import { IsMongoId, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ description: 'Receiver user ID' })
  @IsMongoId()
  @IsNotEmpty()
  toUserId: string;

  @ApiProperty({ description: 'Message content' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}