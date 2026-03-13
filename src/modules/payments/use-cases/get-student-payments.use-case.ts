import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaymentHistory, PaymentHistoryDocument } from '../schemas/payment-history.schema';

@Injectable()
export class GetStudentPaymentsUseCase {
  constructor(
    @InjectModel(PaymentHistory.name) private readonly paymentHistoryModel: Model<PaymentHistoryDocument>,
  ) {}

  async execute(studentId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const filter = { studentId: new Types.ObjectId(studentId) };

    const [data, total] = await Promise.all([
      this.paymentHistoryModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.paymentHistoryModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }
}
