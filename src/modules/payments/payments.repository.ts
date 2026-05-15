import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument, PaymentStatus } from './schemas/payment.schema';

@Injectable()
export class PaymentsRepository {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {}

  async create(data: Partial<Payment>): Promise<PaymentDocument> {
    return new this.paymentModel(data).save();
  }

  async findByIntentId(intentId: string): Promise<PaymentDocument | null> {
    return this.paymentModel.findOne({ stripePaymentIntentId: intentId }).exec();
  }

  async updateStatus(intentId: string, status: PaymentStatus): Promise<void> {
    await this.paymentModel
      .findOneAndUpdate({ stripePaymentIntentId: intentId }, { status })
      .exec();
  }

  async findByUser(userId: string, limit: number, cursor?: string): Promise<PaymentDocument[]> {
    const query: any = { userId };
    if (cursor) query._id = { $lt: cursor };
    return this.paymentModel
      .find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .exec();
  }
}