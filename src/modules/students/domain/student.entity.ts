import { FinancialStatus, PlanType, PaymentMethod } from '../../../shared/types/financial-status.enum';

export class StudentEntity {
  id: string;
  registrationNumber: string;
  name: string;
  cpf: string;
  email?: string;
  phone?: string;
  monthlyFee: number;
  priceLocked?: number;
  planType: PlanType;
  paymentMethod: PaymentMethod;
  financialStatus: FinancialStatus;
  asaasCustomerId?: string;
  asaasCheckoutId?: string;
  checkoutUrl?: string;
  asaasSubscriptionId?: string;
  active: boolean;
  createdAt: Date;

  isPaymentOverdue(graceDays: number = 15): boolean {
    if (this.financialStatus !== FinancialStatus.OVERDUE) return false;
    return true;
  }

  canCheckin(): boolean {
    return this.financialStatus !== FinancialStatus.CANCELLED;
  }

  isScholarship(): boolean {
    return this.planType === PlanType.SCHOLARSHIP;
  }
}
