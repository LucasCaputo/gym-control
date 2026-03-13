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

    if (dto.monthlyFee < 5) {
      throw new BadRequestException('Monthly fee must be at least R$ 5.00 (Asaas minimum charge)');
    }

    // Salva o aluno no banco antes de chamar o Asaas (webhook precisa do externalReference = studentId).
    // Se a integração falhar, removemos o aluno para o usuário poder tentar novamente.
    const student = await this.studentModel.create({
      registrationNumber,
      name: dto.name,
      cpf: normalizedCpf,
      email: dto.email,
      phone: dto.mobilePhone || dto.phone,
      monthlyFee: dto.monthlyFee,
      priceLocked: dto.monthlyFee,
      planType: PlanType.PAID,
      paymentMethod: PaymentMethod.CARD,
      financialStatus: FinancialStatus.PENDING,
      active: true,
    });

    const studentId = (student as any)._id.toString();
    let asaasCustomerId: string | null = null;

    try {
      asaasCustomerId = await this.asaasService.createCustomer({
        name: dto.name,
        cpfCnpj: normalizedCpf,
        email: dto.email,
        phone: dto.phone,
        mobilePhone: dto.mobilePhone,
        address: dto.address,
        addressNumber: dto.addressNumber,
        complement: dto.complement,
        province: dto.province,
        postalCode: dto.postalCode,
        externalReference: studentId,
      });

      const { checkoutId, checkoutUrl } = await this.asaasService.createRecurringCheckout({
        customerId: asaasCustomerId,
        customerName: dto.name,
        customerCpf: normalizedCpf,
        customerEmail: dto.email,
        customerPhone: dto.mobilePhone || dto.phone,
        customerAddress: dto.address,
        customerAddressNumber: dto.addressNumber,
        customerComplement: dto.complement,
        customerProvince: dto.province,
        customerPostalCode: dto.postalCode,
        amount: dto.monthlyFee,
        externalReference: studentId,
      });

      await this.studentModel.findByIdAndUpdate(studentId, {
        asaasCustomerId,
        asaasCheckoutId: checkoutId,
        checkoutUrl,
      }).exec();

      this.logger.log(`Student registered: ${studentId}`);
      return { checkoutUrl, studentId };
    } catch (error) {
      this.logger.error(`Asaas integration failed for student ${studentId}: ${error.message}`);
      await this.studentModel.findByIdAndDelete(studentId).exec();
      if (asaasCustomerId) {
        try {
          await this.asaasService.deleteCustomer(asaasCustomerId);
          this.logger.log(`Asaas customer ${asaasCustomerId} removed after failure so user can retry`);
        } catch (rollbackError: any) {
          this.logger.warn(`Failed to rollback Asaas customer ${asaasCustomerId}: ${rollbackError?.message}`);
        }
      }
      throw error;
    }
  }
}
