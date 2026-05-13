import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PostVisibility, PostMediaType } from '../schemas/post.schema';

export class CreatePostDto {
  @ApiPropertyOptional({ example: 'Enjoying the sunset 🌅', maxLength: 2200 })
  @IsString()
  @IsOptional()
  @MaxLength(2200)
  caption?: string;

  @ApiPropertyOptional({ enum: PostVisibility, default: PostVisibility.PUBLIC })
  @IsEnum(PostVisibility)
  @IsOptional()
  visibility?: PostVisibility;

  @ApiPropertyOptional({ enum: PostMediaType })
  @IsEnum(PostMediaType)
  @IsOptional()
  mediaType?: PostMediaType;
}