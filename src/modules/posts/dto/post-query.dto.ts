import { IsOptional, IsInt, Min, Max, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PostQueryDto {
  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({ description: 'Cursor from previous page (last post _id)' })
  @IsOptional()
  @IsMongoId()
  cursor?: string;
}