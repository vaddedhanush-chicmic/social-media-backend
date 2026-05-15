import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentsRepository } from './payments.repository';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
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
        console.log('WEBHOOK SECRET:', this.webhookSecret);
    }

    async createCheckout(userId: string, dto: CreateCheckoutDto) {
        const intent = await this.stripe.paymentIntents.create({
            amount: dto.amount,
            currency: 'inr',
            automatic_payment_methods: { enabled: true },
            metadata: { userId, purpose: dto.purpose },
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
    async createSubscription(userId: string, dto: CreateSubscriptionDto) {
        // 1. Fetch the user document from the database
        const user = await this.usersService.findById(userId);
        if (!user) throw new BadRequestException('User not found');

        // 2. Get/create Stripe customer for this user
        let stripeCustomerId = (user as any).stripeCustomerId;
        if (!stripeCustomerId) {
            const customer = await this.stripe.customers.create({
                email: user.email,
                metadata: { userId },
            });
            stripeCustomerId = customer.id;
            await this.usersService.update(userId, { stripeCustomerId });
        }

        // 3. Look up the price to get the amount
        const price = await this.stripe.prices.retrieve(dto.priceId);
        if (!price.unit_amount) throw new BadRequestException('Invalid price');

        const intent = await this.stripe.paymentIntents.create({
            amount: price.unit_amount,
            currency: price.currency,
            customer: stripeCustomerId,
            automatic_payment_methods: { enabled: true },
            setup_future_usage: 'off_session',
            metadata: {
                userId,
                purpose: 'subscription',
                priceId: dto.priceId,
                plan: dto.plan || '',
            },
        });

        await this.paymentsRepository.create({
            userId: userId as any,
            stripePaymentIntentId: intent.id,
            stripeClientSecret: intent.client_secret!,
            amount: price.unit_amount,
            currency: price.currency,
            purpose: 'premium_subscription' as any,
            metadata: intent.metadata as Record<string, string>,
        });

        return {
            subscriptionId: 'pending',
            clientSecret: intent.client_secret,
        };
    }

    private async fulfillPayment(intent: any) {
        const { userId, purpose } = intent.metadata;

        if (purpose === 'premium_subscription') {
            await this.usersService.update(userId, { isPremium: true });
            console.log(`User ${userId} tagged as premium`);
        }

        if (purpose === 'subscription') {
            // Payment succeeded — create the recurring subscription using the saved card
            const paymentMethods = await this.stripe.paymentMethods.list({
                customer: intent.customer as string,
                type: 'card',
            });

            const defaultPm = paymentMethods.data[0]?.id;
            if (defaultPm) {
                const subscription = await this.stripe.subscriptions.create({
                    customer: intent.customer as string,
                    items: [{ price: intent.metadata.priceId }],
                    default_payment_method: defaultPm,
                });
                console.log(`Subscription ${subscription.id} created for user ${userId}`);
            }

            await this.usersService.update(userId, { isPremium: true });
            console.log(`User ${userId} tagged as premium (subscription)`);
        }
    }
}