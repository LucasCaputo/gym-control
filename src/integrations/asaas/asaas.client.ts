import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { AppConfigService } from '../../config/config.service';
import {
  AsaasCustomerSaveRequest,
  AsaasCustomerResponse,
  AsaasCheckoutSaveRequest,
  AsaasCheckoutResponse,
  AsaasSubscriptionSaveRequest,
  AsaasSubscriptionResponse,
} from './asaas.types';

@Injectable()
export class AsaasClient {
  private readonly logger = new Logger(AsaasClient.name);

  constructor(private readonly configService: AppConfigService) {}

  private get baseUrl(): string {
    return this.configService.asaasBaseUrl;
  }

  private get headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'access_token': this.configService.asaasAccessToken,
    };
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    this.logger.log(`[Asaas] ${method} ${url}`);

    const options: RequestInit = {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    };

    const response = await fetch(url, options);
    const json = await response.json();

    if (!response.ok) {
      this.logger.error(`[Asaas] Error ${response.status}: ${JSON.stringify(json)}`);
      const errors = json?.errors?.map((e: any) => e.description).join(', ') || 'Asaas API error';
      throw new InternalServerErrorException(errors);
    }

    this.logger.log(`[Asaas] Response ${method} ${path}: ${JSON.stringify(json)}`);
    return json as T;
  }

  async createCustomer(data: AsaasCustomerSaveRequest): Promise<AsaasCustomerResponse> {
    return this.request<AsaasCustomerResponse>('POST', '/v3/customers', data);
  }

  async deleteCustomer(customerId: string): Promise<void> {
    await this.request<{ deleted: boolean }>('DELETE', `/v3/customers/${customerId}`);
  }

  async createCheckout(data: AsaasCheckoutSaveRequest): Promise<AsaasCheckoutResponse> {
    return this.request<AsaasCheckoutResponse>('POST', '/v3/checkouts', data);
  }

  async createSubscription(data: AsaasSubscriptionSaveRequest): Promise<AsaasSubscriptionResponse> {
    return this.request<AsaasSubscriptionResponse>('POST', '/v3/subscriptions', data);
  }

  async deleteSubscription(subscriptionId: string): Promise<void> {
    await this.request<any>('DELETE', `/v3/subscriptions/${subscriptionId}`);
  }

  async getSubscription(subscriptionId: string): Promise<AsaasSubscriptionResponse> {
    return this.request<AsaasSubscriptionResponse>('GET', `/v3/subscriptions/${subscriptionId}`);
  }
}
