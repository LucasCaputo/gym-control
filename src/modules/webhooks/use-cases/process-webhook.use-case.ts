import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Student, StudentDocument } from '../../students/schemas/student.schema';
import { PaymentHistory, PaymentHistoryDocument } from '../../payments/schemas/payment-history.schema';
import { FinancialStatus } from '../../../shared/types/financial-status.enum';
import { AsaasWebhookDto } from '../dto/webhook.dto';

const HANDLED_EVENTS = [
  'PAYMENT_CREATED',
  'PAYMENT_RECEIVED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_OVERDUE',
  'SUBSCRIPTION_DELETED',
  'CHECKOUT_PAID',
];

@Injectable()
export class ProcessWebhookUseCase {
  private readonly logger = new Logger(ProcessWebhookUseCase.name);

  constructor(
    @InjectModel(Student.name) private readonly studentModel: Model<StudentDocument>,
    @InjectModel(PaymentHistory.name) private readonly paymentHistoryModel: Model<PaymentHistoryDocument>,
  ) {}

  async execute(payload: AsaasWebhookDto): Promise<void> {
    this.logger.log(
      `[Webhook] Event: ${payload.event} | PaymentId: ${payload.payment?.id} | SubscriptionId: ${payload.payment?.subscription} | Payload: ${JSON.stringify(payload)}`,
    );

    if (!HANDLED_EVENTS.includes(payload.event)) {
      this.logger.log(`[Webhook] Ignoring unhandled event: ${payload.event}`);
      return;
    }

    if (payload.event === 'CHECKOUT_PAID') {
      await this.handleCheckoutPaid(payload);
      return;
    }

    if (payload.event === 'SUBSCRIPTION_DELETED') {
      await this.handleSubscriptionDeleted(payload);
      return;
    }

    if (payload.payment) {
      await this.handlePaymentEvent(payload);
    }
  }

  private async handlePaymentEvent(payload: AsaasWebhookDto): Promise<void> {
    const payment = payload.payment!;

    let student = await this.studentModel
      .findOne({ asaasCustomerId: payment.customer })
      .exec();

    if (!student && payment.externalReference) {
      student = await this.studentModel.findById(payment.externalReference).exec();
    }

    if (!student && payment.checkoutSession) {
      student = await this.studentModel
        .findOne({ asaasCheckoutId: payment.checkoutSession })
        .exec();
    }

    if (!student) {
      this.logger.warn(
        `[Webhook] Student not found | customer: ${payment.customer} | externalReference: ${payment.externalReference} | checkoutSession: ${payment.checkoutSession}`,
      );
      return;
    }

    const studentId = (student as any)._id as Types.ObjectId;

    const updates: Record<string, any> = {};
    if (!student.asaasCustomerId && payment.customer) {
      updates.asaasCustomerId = payment.customer;
    }
    if (!student.asaasSubscriptionId && payment.subscription) {
      updates.asaasSubscriptionId = payment.subscription;
    }
    if (Object.keys(updates).length > 0) {
      await this.studentModel.findByIdAndUpdate(studentId, updates).exec();
      this.logger.log(`[Webhook] Student ${studentId} linked: ${JSON.stringify(updates)}`);
    }

    const existing = await this.paymentHistoryModel
      .findOne({ asaasPaymentId: payment.id })
      .exec();

    const paidDate = payment.paymentDate || payment.confirmedDate || payment.clientPaymentDate;

    if (!existing) {
      await this.paymentHistoryModel.create({
        studentId,
        asaasPaymentId: payment.id,
        asaasSubscriptionId: payment.subscription,
        amount: payment.value,
        method: payment.billingType === 'PIX' ? 'PIX' : 'CARD',
        status: payment.status,
        dueDate: new Date(payment.dueDate),
        paidAt: paidDate ? new Date(paidDate) : undefined,
      });
      this.logger.log(`[Webhook] PaymentHistory created for payment: ${payment.id}`);
    } else {
      await this.paymentHistoryModel
        .findByIdAndUpdate((existing as any)._id, {
          status: payment.status,
          paidAt: paidDate ? new Date(paidDate) : undefined,
        })
        .exec();
      this.logger.log(`[Webhook] PaymentHistory updated for payment: ${payment.id}`);
    }

    const confirmedStatuses = ['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'];
    let newFinancialStatus: FinancialStatus | undefined;

    if (confirmedStatuses.includes(payment.status)) {
      newFinancialStatus = FinancialStatus.ACTIVE;
    } else if (payload.event === 'PAYMENT_OVERDUE') {
      newFinancialStatus = FinancialStatus.OVERDUE;
    }

    if (newFinancialStatus) {
      await this.studentModel
        .findByIdAndUpdate(studentId, { financialStatus: newFinancialStatus })
        .exec();
      this.logger.log(`[Webhook] Student ${studentId} financialStatus updated to ${newFinancialStatus}`);
    }
  }

  private async handleCheckoutPaid(payload: AsaasWebhookDto): Promise<void> {
    const checkout = payload.checkout;
    if (!checkout?.externalReference) {
      this.logger.warn('[Webhook] CHECKOUT_PAID without externalReference, ignoring');
      return;
    }

    const studentId = checkout.externalReference;

    const student = await this.studentModel.findById(studentId).exec();
    if (!student) {
      this.logger.warn(`[Webhook] Student not found for externalReference: ${studentId}`);
      return;
    }

    await this.studentModel
      .findByIdAndUpdate(studentId, {
        financialStatus: FinancialStatus.ACTIVE,
        asaasCheckoutId: checkout.id,
      })
      .exec();

    this.logger.log(
      `[Webhook] CHECKOUT_PAID → Student ${studentId} financialStatus updated to ${FinancialStatus.ACTIVE}`,
    );
  }

  private async handleSubscriptionDeleted(payload: AsaasWebhookDto): Promise<void> {
    const subscriptionId = payload.payment?.subscription;
    if (!subscriptionId) return;

    await this.studentModel
      .findOneAndUpdate(
        { asaasSubscriptionId: subscriptionId },
        { financialStatus: FinancialStatus.CANCELLED },
      )
      .exec();

    this.logger.log(`[Webhook] Subscription ${subscriptionId} deleted → student marked CANCELLED`);
  }
}
