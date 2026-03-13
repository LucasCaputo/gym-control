export class AsaasWebhookDto {
  event: string;
  payment?: {
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
  };
}
