import { Injectable } from '@nestjs/common';
import { AsaasCheckoutResponse, AsaasCustomerResponse, AsaasSubscriptionResponse } from './asaas.types';

@Injectable()
export class AsaasMapper {
  toCustomerId(response: AsaasCustomerResponse): string {
    return response.id;
  }

  toCheckoutUrl(response: AsaasCheckoutResponse): { checkoutId: string; checkoutUrl: string } {
    return {
      checkoutId: response.id,
      checkoutUrl: response.link,
    };
  }

  toSubscriptionId(response: AsaasSubscriptionResponse): string {
    return response.id;
  }
}
