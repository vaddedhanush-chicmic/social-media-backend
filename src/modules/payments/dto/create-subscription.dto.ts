import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'price_1ABC...', description: 'Stripe Price ID for the subscription plan' })
  @IsString()
  priceId: string;

  @ApiProperty({ required: false, example: 'monthly', description: 'Plan label (monthly/yearly) — stored as metadata' })
  @IsOptional()
  @IsString()
  plan?: string;
}
