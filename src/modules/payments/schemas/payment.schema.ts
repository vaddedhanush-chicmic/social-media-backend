import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentDocument = HydratedDocument<Payment>;

export enum PaymentStatus {
  PENDING   = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED    = 'failed',
  REFUNDED  = 'refunded',
}

export enum PaymentPurpose {
  PREMIUM_SUBSCRIPTION = 'premium_subscription',
  //TIP_TO_USER          = 'tip_to_user',
  //BOOST_POST           = 'boost_post',
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  stripePaymentIntentId: string;

  @Prop({ required: true })
  stripeClientSecret: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, default: 'inr' })
  currency: string;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop({ type: String, enum: PaymentPurpose, required: true })
  purpose: PaymentPurpose;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, string>;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
PaymentSchema.index({ userId: 1, createdAt: -1 });
// stripePaymentIntentId index is already created by @Prop({ unique: true })