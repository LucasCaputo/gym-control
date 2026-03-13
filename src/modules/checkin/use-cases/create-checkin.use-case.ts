import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Checkin, CheckinDocument } from '../schemas/checkin.schema';
import { Student, StudentDocument } from '../../students/schemas/student.schema';
import { PaymentHistory, PaymentHistoryDocument } from '../../payments/schemas/payment-history.schema';
import { FinancialStatus } from '../../../shared/types/financial-status.enum';

const CHECKIN_COOLDOWN_MINUTES = 45;
const OVERDUE_GRACE_DAYS = 15;

@Injectable()
export class CreateCheckinUseCase {
  constructor(
    @InjectModel(Checkin.name) private readonly checkinModel: Model<CheckinDocument>,
    @InjectModel(Student.name) private readonly studentModel: Model<StudentDocument>,
    @InjectModel(PaymentHistory.name) private readonly paymentHistoryModel: Model<PaymentHistoryDocument>,
  ) {}

  async execute(studentId: string, registeredBy: string): Promise<CheckinDocument> {
    const student = await this.studentModel.findById(studentId).exec();
    if (!student) throw new NotFoundException('Student not found');

    if (student.financialStatus === FinancialStatus.CANCELLED) {
      throw new ForbiddenException('Student account is cancelled');
    }

    const cooldownLimit = new Date(Date.now() - CHECKIN_COOLDOWN_MINUTES * 60 * 1000);
    const recentCheckin = await this.checkinModel
      .findOne({ studentId: new Types.ObjectId(studentId), dateTime: { $gte: cooldownLimit } })
      .exec();

    if (recentCheckin) {
      throw new BadRequestException('Check-in already registered in the last 45 minutes');
    }

    if (
      student.financialStatus !== FinancialStatus.EXEMPT &&
      student.financialStatus !== FinancialStatus.ACTIVE
    ) {
      const graceLimitDate = new Date(Date.now() - OVERDUE_GRACE_DAYS * 24 * 60 * 60 * 1000);
      const overduePayment = await this.paymentHistoryModel
        .findOne({
          studentId: new Types.ObjectId(studentId),
          status: { $in: ['OVERDUE', 'PENDING'] },
          dueDate: { $lt: graceLimitDate },
          paidAt: null,
        })
        .sort({ dueDate: 1 })
        .exec();

      if (overduePayment) {
        throw new ForbiddenException('Payment overdue for more than 15 days');
      }
    }

    return this.checkinModel.create({
      studentId: new Types.ObjectId(studentId),
      dateTime: new Date(),
      registeredBy,
    });
  }
}
