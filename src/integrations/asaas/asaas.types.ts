export interface AsaasCustomerSaveRequest {
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
  notificationDisabled?: boolean;
}

export interface AsaasCustomerResponse {
  id: string;
  object: string;
  name: string;
  email?: string;
  phone?: string;
  cpfCnpj: string;
  dateCreated: string;
  deleted: boolean;
  externalReference?: string;
}

export interface AsaasCheckoutCallback {
  successUrl: string;
  cancelUrl: string;
  expiredUrl?: string;
}

export interface AsaasCheckoutItem {
  name: string;
  quantity: number;
  value: number;
  imageBase64: string;
  description?: string;
  externalReference?: string;
}

export interface AsaasCheckoutSubscription {
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  nextDueDate?: string;
  endDate?: string;
}

export interface AsaasCheckoutCustomerData {
  name?: string;
  cpfCnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  addressNumber?: number;
  complement?: string;
  province?: string;
  postalCode?: string;
}

export interface AsaasCheckoutSaveRequest {
  billingTypes: Array<'CREDIT_CARD' | 'PIX'>;
  chargeTypes: Array<'DETACHED' | 'RECURRENT' | 'INSTALLMENT'>;
  minutesToExpire?: number;
  externalReference?: string;
  callback: AsaasCheckoutCallback;
  items: AsaasCheckoutItem[];
  /** ID do cliente já cadastrado no Asaas. Use este OU customerData, nunca os dois. */
  customer?: string;
  customerData?: AsaasCheckoutCustomerData;
  subscription?: AsaasCheckoutSubscription;
}

export interface AsaasCheckoutResponse {
  id: string;
  link: string;
  status: string;
  billingTypes: string[];
  chargeTypes: string[];
  externalReference?: string;
  callback: AsaasCheckoutCallback;
  items: AsaasCheckoutItem[];
  subscription?: AsaasCheckoutSubscription;
}

export interface AsaasSubscriptionSaveRequest {
  customer: string;
  billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX' | 'UNDEFINED';
  value: number;
  nextDueDate: string;
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  description?: string;
  externalReference?: string;
}

export interface AsaasSubscriptionResponse {
  id: string;
  object: string;
  customer: string;
  billingType: string;
  cycle: string;
  value: number;
  nextDueDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'INACTIVE';
  deleted: boolean;
  checkoutSession?: string;
  externalReference?: string;
}

export interface AsaasWebhookPayload {
  event: string;
  payment?: AsaasPaymentData;
}

export interface AsaasPaymentData {
  id: string;
  customer: string;
  subscription?: string;
  value: number;
  netValue?: number;
  status: string;
  dueDate: string;
  paymentDate?: string;
  billingType: string;
  externalReference?: string;
}

export interface AsaasErrorResponse {
  errors: Array<{ code: string; description: string }>;
}
