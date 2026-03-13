import { IsString, IsOptional, Allow } from 'class-validator';

export class AsaasWebhookDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  event: string;

  @IsOptional()
  @IsString()
  dateCreated?: string;

  @IsOptional()
  @Allow()
  account?: Record<string, any>;

  @IsOptional()
  @Allow()
  payment?: {
    id: string;
    customer: string;
    subscription?: string;
    checkoutSession?: string;
    value: number;
    netValue?: number;
    status: string;
    dueDate: string;
    paymentDate?: string;
    confirmedDate?: string;
    clientPaymentDate?: string;
    billingType: string;
    externalReference?: string;
  };

  @IsOptional()
  @Allow()
  checkout?: {
    id: string;
    status: string;
    externalReference?: string;
    items?: Array<{
      name: string;
      description?: string;
      externalReference?: string;
      quantity: number;
      value: number;
    }>;
    subscription?: {
      cycle: string;
      nextDueDate: string;
      endDate?: string;
    };
    customerData?: {
      email: string;
      name: string;
      cpfCnpj: string;
      phoneNumber?: string;
      address?: string;
      addressNumber?: string;
      complement?: string;
      postalCode?: string;
      province?: string;
      cityId?: number;
      cityName?: string;
    };
    billingTypes?: string[];
    chargeTypes?: string[];
    link?: string;
    minutesToExpire?: number;
    callback?: Record<string, any>;
    installment?: any;
    split?: any;
    customer?: any;
  };
}
