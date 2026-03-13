import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Student, StudentDocument } from '../schemas/student.schema';
import { RegisterStudentDto } from '../dto/register-student.dto';
import { AsaasService } from '../../../integrations/asaas/asaas.service';
import { normalizeCpf } from '../../../shared/utils/cpf.utils';
import { FinancialStatus, PaymentMethod, PlanType } from '../../../shared/types/financial-status.enum';

@Injectable()
export class RegisterStudentUseCase {
  private readonly logger = new Logger(RegisterStudentUseCase.name);

  constructor(
    @InjectModel(Student.name) private readonly studentModel: Model<StudentDocument>,
    private readonly asaasService: AsaasService,
  ) {}

  async execute(dto: RegisterStudentDto): Promise<{ checkoutUrl?: string; studentId: string }> {
    const normalizedCpf = normalizeCpf(dto.cpf);

    const existing = await this.studentModel.findOne({ cpf: normalizedCpf }).exec();
    if (existing) {
      throw new ConflictException('CPF already registered');
    }

    const registrationNumber = `AC${Date.now()}`;

    if (dto.planType === PlanType.SCHOLARSHIP) {
      const student = await this.studentModel.create({
        registrationNumber,
        name: dto.name,
        cpf: normalizedCpf,
        email: dto.email,
        phone: dto.phone,
        monthlyFee: 0,
        priceLocked: 0,
        planType: PlanType.SCHOLARSHIP,
        paymentMethod: PaymentMethod.SCHOLARSHIP,
        financialStatus: FinancialStatus.EXEMPT,
        active: true,
      });

      return { studentId: (student as any)._id.toString() };
    }

    if (dto.monthlyFee <= 0) {
      throw new BadRequestException('Monthly fee must be greater than 0 for paid plan');
    }

    const customerId = await this.asaasService.createCustomer({
      name: dto.name,
      cpfCnpj: normalizedCpf,
      email: dto.email,
      phone: dto.phone,
    });

    const { checkoutId, checkoutUrl } = await this.asaasService.createRecurringCheckout({
      customerId,
      customerName: dto.name,
      customerCpf: normalizedCpf,
      amount: dto.monthlyFee,
    });

    const student = await this.studentModel.create({
      registrationNumber,
      name: dto.name,
      cpf: normalizedCpf,
      email: dto.email,
      phone: dto.phone,
      monthlyFee: dto.monthlyFee,
      priceLocked: dto.monthlyFee,
      planType: PlanType.PAID,
      paymentMethod: PaymentMethod.CARD,
      financialStatus: FinancialStatus.PENDING,
      asaasCustomerId: customerId,
      asaasCheckoutId: checkoutId,
      checkoutUrl,
      active: true,
    });

    this.logger.log(`Student registered: ${(student as any)._id}`);
    return { checkoutUrl, studentId: (student as any)._id.toString() };
  }
}
