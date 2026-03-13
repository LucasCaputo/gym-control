import { Injectable, Logger } from '@nestjs/common';
import { AsaasClient } from './asaas.client';
import { AsaasMapper } from './asaas.mapper';
import { AppConfigService } from '../../config/config.service';

export interface CreateAsaasCustomerInput {
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
}

export interface CreateAsaasCheckoutInput {
  customerId: string;
  customerName: string;
  customerCpf: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerAddressNumber?: string;
  customerComplement?: string;
  customerProvince?: string;
  customerPostalCode?: string;
  amount: number;
  externalReference?: string;
}

@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);

  constructor(
    private readonly client: AsaasClient,
    private readonly mapper: AsaasMapper,
    private readonly configService: AppConfigService,
  ) {}

  async deleteCustomer(customerId: string): Promise<void> {
    this.logger.log(`Deleting Asaas customer: ${customerId}`);
    await this.client.deleteCustomer(customerId);
  }

  async createCustomer(input: CreateAsaasCustomerInput): Promise<string> {
    this.logger.log(`Creating Asaas customer for CPF: ${input.cpfCnpj}`);
    const response = await this.client.createCustomer({
      name: input.name,
      cpfCnpj: input.cpfCnpj,
      email: input.email,
      phone: input.phone,
      mobilePhone: input.mobilePhone,
      address: input.address,
      addressNumber: input.addressNumber,
      complement: input.complement,
      province: input.province,
      postalCode: input.postalCode,
      externalReference: input.externalReference,
      notificationDisabled: false,
    });
    return this.mapper.toCustomerId(response);
  }

  async createRecurringCheckout(input: CreateAsaasCheckoutInput): Promise<{ checkoutId: string; checkoutUrl: string }> {
    this.logger.log(`Creating Asaas checkout for customer: ${input.customerId}`);

    const response = await this.client.createCheckout({
      billingTypes: ['CREDIT_CARD'],
      chargeTypes: ['RECURRENT'],
      callback: {
        successUrl: this.configService.checkoutSuccessUrl,
        cancelUrl: this.configService.checkoutCancelUrl,
      },
      items: [
        {
          name: 'Mensalidade Academia',
          quantity: 1,
          value: input.amount,
          imageBase64: '',
          description: 'Plano mensal de artes marciais',
          externalReference: input.externalReference,
        },
      ],
      customerData: {
        name: input.customerName,
        cpfCnpj: input.customerCpf,
        email: input.customerEmail,
        phone: input.customerPhone,
        address: input.customerAddress,
        addressNumber: input.customerAddressNumber ? parseInt(input.customerAddressNumber) : undefined,
        complement: input.customerComplement,
        province: input.customerProvince,
        postalCode: input.customerPostalCode,
      },
      subscription: {
        cycle: 'MONTHLY',
        nextDueDate: new Date().toISOString().split('T')[0],
      },
      externalReference: input.externalReference,
    });

    return this.mapper.toCheckoutUrl(response);
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    this.logger.log(`Cancelling Asaas subscription: ${subscriptionId}`);
    await this.client.deleteSubscription(subscriptionId);
  }
}
