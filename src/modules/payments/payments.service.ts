import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentsRepository } from './payments.repository';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { PaymentStatus } from './schemas/payment.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class PaymentsService {
  private stripe: InstanceType<typeof Stripe>;
  private webhookSecret: string;

  constructor(
    private configService: ConfigService,
    private paymentsRepository: PaymentsRepository,
    private usersService: UsersService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('stripe.secretKey')!,
      { apiVersion: '2026-04-22.dahlia' },
    );
    this.webhookSecret = this.configService.get<string>('stripe.webhookSecret')!;
  }

  async createCheckout(userId: string, dto: CreateCheckoutDto) {
    const intent = await this.stripe.paymentIntents.create({
        amount: dto.amount,
        currency: this.configService.get<string>('stripe.currency') || 'inr',
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        metadata: {
          userId,
          purpose: dto.purpose,
        },
    });

    await this.paymentsRepository.create({
        userId: userId as any,
        stripePaymentIntentId: intent.id,
        stripeClientSecret: intent.client_secret!,
        amount: dto.amount,
        currency: intent.currency,
        purpose: dto.purpose,
        metadata: intent.metadata as Record<string, string>,
    });

    return {
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
    };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    let event: ReturnType<typeof this.stripe.webhooks.constructEvent> extends Promise<infer T> ? T : ReturnType<typeof this.stripe.webhooks.constructEvent>;

    try {
      event = await this.stripe.webhooks.constructEventAsync(
        rawBody,
        signature,
        this.webhookSecret,
      );
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object as any;
        await this.paymentsRepository.updateStatus(intent.id, PaymentStatus.SUCCEEDED);
        await this.fulfillPayment(intent);
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as any;
        await this.paymentsRepository.updateStatus(intent.id, PaymentStatus.FAILED);
        break;
      }
    }

    return { received: true };
  }

  async getMyPayments(userId: string, query: PaymentQueryDto) {
    const limit = query.limit ?? 10;
    const rows = await this.paymentsRepository.findByUser(userId, limit + 1, query.cursor);
    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    return {
      data,
      nextCursor: hasMore ? data[data.length - 1]._id : null,
    };
  }

  private async fulfillPayment(intent: any) {
    const { userId, purpose } = intent.metadata;
    if (purpose === 'premium_subscription') {
      await this.usersService.update(userId, { isPremium: true });
      console.log(`User ${userId} tagged as premium`);
    }
  }
}