import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Student, StudentDocument } from '../../students/schemas/student.schema';
import { AsaasService } from '../../../integrations/asaas/asaas.service';
import { FinancialStatus } from '../../../shared/types/financial-status.enum';

@Injectable()
export class CancelSubscriptionUseCase {
  constructor(
    @InjectModel(Student.name) private readonly studentModel: Model<StudentDocument>,
    private readonly asaasService: AsaasService,
  ) {}

  async execute(studentId: string): Promise<void> {
    const student = await this.studentModel.findById(studentId).exec();
    if (!student) throw new NotFoundException('Student not found');
    if (!student.asaasSubscriptionId) {
      throw new BadRequestException('No active subscription found');
    }

    await this.asaasService.cancelSubscription(student.asaasSubscriptionId);
    await this.studentModel
      .findByIdAndUpdate(studentId, {
        financialStatus: FinancialStatus.CANCELLED,
        asaasSubscriptionId: null,
        active: false,
      })
      .exec();
  }
}
