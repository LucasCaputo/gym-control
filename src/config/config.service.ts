import { Injectable, Logger } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);

  constructor(private readonly config: NestConfigService) {}

  get nodeEnv(): string {
    return this.config.get<string>('NODE_ENV', 'development');
  }

  get port(): number {
    return this.config.get<number>('PORT', 3000);
  }

  get mongodbUri(): string {
    return this.config.getOrThrow<string>('MONGODB_URI');
  }

  get jwtSecret(): string {
    return this.config.getOrThrow<string>('JWT_SECRET');
  }

  get asaasAccessToken(): string {
    return this.config.getOrThrow<string>('ASAAS_ACCESS_TOKEN');
  }

  get asaasBaseUrl(): string {
    return this.config.get<string>('ASAAS_BASE_URL', 'https://api-sandbox.asaas.com');
  }

  get asaasWebhookToken(): string {
    return this.config.getOrThrow<string>('ASAAS_WEBHOOK_TOKEN');
  }

  get checkoutSuccessUrl(): string {
    return this.config.get<string>('CHECKOUT_SUCCESS_URL', 'https://example.com/checkout/success');
  }

  get checkoutCancelUrl(): string {
    return this.config.get<string>('CHECKOUT_CANCEL_URL', 'https://example.com/checkout/cancel');
  }
}
