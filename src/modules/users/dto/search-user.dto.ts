import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchUserDto {
  @ApiProperty({ example: 'johndoe', description: 'The search query (username or email)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  query: string;
}
