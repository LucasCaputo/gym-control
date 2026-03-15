import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Student, StudentDocument } from '../schemas/student.schema';
import { normalizeCpf } from '../../../shared/utils/cpf.utils';
import { Role } from '../../../shared/types/roles.enum';
import {
  FinancialStatus,
  PlanType,
} from '../../../shared/types/financial-status.enum';

@Injectable()
export class SearchStudentsUseCase {
  constructor(
    @InjectModel(Student.name) private readonly studentModel: Model<StudentDocument>,
  ) {}

  async execute(
    q: string | undefined,
    role: Role,
    page: number = 1,
    limit: number = 20,
    active?: string,
    planType?: string,
    financialStatus?: string,
  ): Promise<any> {
    const skip = (page - 1) * limit;

    if (role === Role.CHECKIN) {
      if (!q) {
        return { data: [], total: 0 };
      }
      const normalized = normalizeCpf(q);
      const filter: any = {
        active: true,
        $or: [
          { cpf: normalized },
          { name: { $regex: q, $options: 'i' } },
        ],
      };

      const students = await this.studentModel
        .find(filter, { _id: 1, name: 1 })
        .limit(limit)
        .skip(skip)
        .exec();

      return {
        data: students.map((s: any) => ({ id: s._id.toString(), name: s.name })),
        total: students.length,
      };
    }

    const baseFilter: any = {};
    if (active === 'true') baseFilter.active = true;
    if (active === 'false') baseFilter.active = false;
    if (planType && Object.values(PlanType).includes(planType as PlanType)) {
      baseFilter.planType = planType;
    }
    if (
      financialStatus &&
      Object.values(FinancialStatus).includes(financialStatus as FinancialStatus)
    ) {
      baseFilter.financialStatus = financialStatus;
    }

    if (!q) {
      const total = await this.studentModel.countDocuments(baseFilter).exec();
      const students = await this.studentModel
        .find(baseFilter)
        .limit(limit)
        .skip(skip)
        .exec();

      return { data: students, total, page, limit };
    }

    const normalized = normalizeCpf(q);
    const filter: any = {
      ...baseFilter,
      $or: [
        { cpf: normalized },
        { name: { $regex: q, $options: 'i' } },
      ],
    };

    const [students, total] = await Promise.all([
      this.studentModel.find(filter).limit(limit).skip(skip).exec(),
      this.studentModel.countDocuments(filter).exec(),
    ]);

    return { data: students, total, page, limit };
  }
}
