import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Student, StudentDocument } from '../schemas/student.schema';
import { PaymentHistory, PaymentHistoryDocument } from '../../payments/schemas/payment-history.schema';
import { Checkin, CheckinDocument } from '../../checkin/schemas/checkin.schema';
import { PlanType } from '../../../shared/types/financial-status.enum';
import { AsaasService } from '../../../integrations/asaas/asaas.service';

@Injectable()
export class DeleteStudentUseCase {
  constructor(
    @InjectModel(Student.name) private readonly studentModel: Model<StudentDocument>,
    @InjectModel(PaymentHistory.name) private readonly paymentHistoryModel: Model<PaymentHistoryDocument>,
    @InjectModel(Checkin.name) private readonly checkinModel: Model<CheckinDocument>,
    private readonly asaasService: AsaasService,
  ) {}

  async execute(id: string): Promise<void> {
    const student = await this.studentModel.findById(id).exec();
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (student.planType === PlanType.SCHOLARSHIP) {
      throw new BadRequestException('Não é possível excluir aluno bolsista');
    }

    const paymentsCount = await this.paymentHistoryModel
      .countDocuments({ studentId: new Types.ObjectId(id) })
      .exec();
    if (paymentsCount > 0) {
      throw new BadRequestException('Aluno possui pagamentos registrados');
    }

    const checkinsCount = await this.checkinModel
      .countDocuments({ studentId: new Types.ObjectId(id) })
      .exec();
    if (checkinsCount > 0) {
      throw new BadRequestException('Aluno possui presenças registradas');
    }

    if (student.asaasCustomerId) {
      try {
        await this.asaasService.deleteCustomer(student.asaasCustomerId);
      } catch {
        // Não bloqueia a exclusão local se Asaas falhar
      }
    }

    await this.studentModel.findByIdAndDelete(id).exec();
  }
}
