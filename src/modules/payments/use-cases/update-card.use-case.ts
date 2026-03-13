import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Student, StudentDocument } from '../../students/schemas/student.schema';
import { AsaasService } from '../../../integrations/asaas/asaas.service';
import { PlanType } from '../../../shared/types/financial-status.enum';

@Injectable()
export class UpdateCardUseCase {
  constructor(
    @InjectModel(Student.name) private readonly studentModel: Model<StudentDocument>,
    private readonly asaasService: AsaasService,
  ) {}

  async execute(studentId: string): Promise<{ checkoutUrl: string }> {
    const student = await this.studentModel.findById(studentId).exec();
    if (!student) throw new NotFoundException('Student not found');
    if (student.planType === PlanType.SCHOLARSHIP) {
      throw new BadRequestException('Scholarship students do not have a card');
    }
    if (!student.asaasCustomerId) {
      throw new BadRequestException('Student does not have an Asaas customer ID');
    }

    const { checkoutId, checkoutUrl } = await this.asaasService.createRecurringCheckout({
      customerId: student.asaasCustomerId,
      customerName: student.name,
      customerCpf: student.cpf,
      amount: student.priceLocked || student.monthlyFee,
      externalReference: (student as any)._id.toString(),
    });

    await this.studentModel
      .findByIdAndUpdate(studentId, { asaasCheckoutId: checkoutId, checkoutUrl })
      .exec();

    return { checkoutUrl };
  }
}
