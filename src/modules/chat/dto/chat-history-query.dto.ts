import { IsMongoId, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ChatHistoryQueryDto {
  @ApiPropertyOptional({ description: 'Cursor for pagination (last message ID)' })
  @IsMongoId()
  @IsOptional()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Number of messages to fetch', default: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}