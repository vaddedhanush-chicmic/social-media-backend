import { Type } from 'class-transformer';
import { IsOptional, IsString, Min } from 'class-validator';

export class FollowQueryDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  cursor?: string;
}