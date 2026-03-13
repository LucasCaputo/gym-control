import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentHistoryDocument = PaymentHistory & Document;

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: false }, collection: 'payment_histories' })
export class PaymentHistory {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Student', index: true })
  studentId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  asaasPaymentId: string;

  @Prop({ required: false })
  asaasSubscriptionId: string;

  @Prop({ required: true, type: Number })
  amount: number;

  @Prop({ required: true, default: 'CARD' })
  method: string;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  dueDate: Date;

  @Prop({ required: false })
  paidAt: Date;

  @Prop()
  createdAt: Date;
}

export const PaymentHistorySchema = SchemaFactory.createForClass(PaymentHistory);
