import {
  IsMongoId,
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsUrl,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class SendMessageDto {
  @ApiProperty({ description: 'Receiver user ID' })
  @IsMongoId()
  @IsNotEmpty()
  toUserId: string;

  @ApiPropertyOptional({ description: 'Text content of the message' })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: 'Giphy GIF URL' })
  @IsUrl()
  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  gifUrl?: string;

  // At least one of content, gifUrl, or attachments (file) must be present
  // attachments come from multipart upload — validated in controller
  @ValidateIf((o) => !o.content && !o.gifUrl)
  @IsNotEmpty({ message: 'Message must have text, a GIF, or an attachment' })
  _atLeastOne?: never;
}