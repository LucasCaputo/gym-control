import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Student, StudentDocument } from '../../students/schemas/student.schema';
import { PaymentHistory, PaymentHistoryDocument } from '../../payments/schemas/payment-history.schema';
import { FinancialStatus } from '../../../shared/types/financial-status.enum';
import { AsaasWebhookDto } from '../dto/webhook.dto';

const HANDLED_EVENTS = [
  'PAYMENT_RECEIVED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_OVERDUE',
  'SUBSCRIPTION_DELETED',
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

    const student = await this.studentModel
      .findOne({ asaasCustomerId: payment.customer })
      .exec();

    if (!student) {
      this.logger.warn(`[Webhook] Student not found for customer: ${payment.customer}`);
      return;
    }

    const studentId = (student as any)._id as Types.ObjectId;

    const existing = await this.paymentHistoryModel
      .findOne({ asaasPaymentId: payment.id })
      .exec();

    if (!existing) {
      await this.paymentHistoryModel.create({
        studentId,
        asaasPaymentId: payment.id,
        asaasSubscriptionId: payment.subscription,
        amount: payment.value,
        method: 'CARD',
        status: payment.status,
        dueDate: new Date(payment.dueDate),
        paidAt: payment.paymentDate ? new Date(payment.paymentDate) : undefined,
      });
    } else {
      await this.paymentHistoryModel
        .findByIdAndUpdate((existing as any)._id, {
          status: payment.status,
          paidAt: payment.paymentDate ? new Date(payment.paymentDate) : undefined,
        })
        .exec();
    }

    if (payment.subscription && !student.asaasSubscriptionId) {
      await this.studentModel
        .findByIdAndUpdate(studentId, { asaasSubscriptionId: payment.subscription })
        .exec();
    }

    let newFinancialStatus: FinancialStatus | undefined;

    if (payload.event === 'PAYMENT_RECEIVED' || payload.event === 'PAYMENT_CONFIRMED') {
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
