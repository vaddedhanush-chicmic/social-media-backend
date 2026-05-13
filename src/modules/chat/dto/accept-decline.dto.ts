import { IsMongoId, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptDeclineDto {
  @ApiProperty({ description: 'Conversation ID to accept or decline' })
  @IsMongoId()
  @IsNotEmpty()
  conversationId: string;
}