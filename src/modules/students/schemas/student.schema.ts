import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FinancialStatus, PlanType, PaymentMethod } from '../../../shared/types/financial-status.enum';

export type StudentDocument = Student & Document;

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: false }, collection: 'students' })
export class Student {
  @Prop({ unique: true, index: true })
  registrationNumber: string;

  @Prop({ required: true, index: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  cpf: string;

  @Prop({ required: false })
  email: string;

  @Prop({ required: false })
  phone: string;

  @Prop({ required: true, type: Number })
  monthlyFee: number;

  @Prop({ required: false, type: Number })
  priceLocked: number;

  @Prop({ required: true, enum: Object.values(PlanType) })
  planType: PlanType;

  @Prop({ required: true, enum: Object.values(PaymentMethod) })
  paymentMethod: PaymentMethod;

  @Prop({ required: true, enum: Object.values(FinancialStatus), default: FinancialStatus.PENDING })
  financialStatus: FinancialStatus;

  @Prop({ required: false, index: true })
  asaasCustomerId: string;

  @Prop({ required: false, index: true })
  asaasCheckoutId: string;

  @Prop({ required: false })
  checkoutUrl: string;

  @Prop({ required: false })
  asaasSubscriptionId: string;

  @Prop({ default: true })
  active: boolean;

  @Prop()
  createdAt: Date;
}

export const StudentSchema = SchemaFactory.createForClass(Student);
