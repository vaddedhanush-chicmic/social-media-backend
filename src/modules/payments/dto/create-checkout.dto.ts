import { IsEnum, IsInt, Min, IsOptional, IsUrl, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentPurpose } from '../schemas/payment.schema';

export class CreateCheckoutDto {
  @ApiProperty({ enum: PaymentPurpose })
  @IsEnum(PaymentPurpose)
  purpose: PaymentPurpose;

  @ApiProperty({ example: 15000, description: 'Amount in paise (15000 = ₹150)' })
  @IsInt()
  @Min(50)
  amount: number;

  @ApiProperty({ required: false, example: 'http://localhost:3000/payment.html' })
  @IsOptional()
  @IsString()
  returnUrl?: string;
}