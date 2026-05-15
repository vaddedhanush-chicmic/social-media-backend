import { IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentPurpose } from '../schemas/payment.schema';

export class CreateCheckoutDto {
  @ApiProperty({ enum: PaymentPurpose })
  @IsEnum(PaymentPurpose)
  purpose: PaymentPurpose;

  @ApiProperty({ example: 999, description: 'Amount in paise (999 = ₹9.99)' })
  @IsInt()
  @Min(50)
  amount: number;
}