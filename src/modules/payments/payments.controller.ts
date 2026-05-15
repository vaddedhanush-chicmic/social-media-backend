import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Req,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @ApiBearerAuth()
  @Post('checkout')
  @ApiOperation({ summary: 'Create a payment intent and return client secret' })
  createCheckout(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateCheckoutDto,
  ) {
    return this.paymentsService.createCheckout(userId, dto);
  }

  @ApiBearerAuth()
  @Post('subscriptions')
  @ApiOperation({ summary: 'Create a subscription with optional free trial' })
  createSubscription(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.paymentsService.createSubscription(userId, dto);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook receiver' })
  handleWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(req.rawBody!, signature);
  }

  @ApiBearerAuth()
  @Get('my-payments')
  @ApiOperation({ summary: 'Get my payment history' })
  getMyPayments(
    @CurrentUser('userId') userId: string,
    @Query() query: PaymentQueryDto,
  ) {
    return this.paymentsService.getMyPayments(userId, query);
  }
}