import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Student, StudentDocument } from './schemas/student.schema';

@Injectable()
export class StudentsService {
  constructor(
    @InjectModel(Student.name) private readonly studentModel: Model<StudentDocument>,
  ) {}

  async findById(id: string): Promise<StudentDocument> {
    const student = await this.studentModel.findById(id).exec();
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async findByAsaasCustomerId(customerId: string): Promise<StudentDocument | null> {
    return this.studentModel.findOne({ asaasCustomerId: customerId }).exec();
  }

  async updateFinancialStatus(id: string, status: string): Promise<void> {
    await this.studentModel.findByIdAndUpdate(id, { financialStatus: status }).exec();
  }

  async softDelete(id: string): Promise<void> {
    await this.studentModel.findByIdAndUpdate(id, { active: false }).exec();
  }
}
