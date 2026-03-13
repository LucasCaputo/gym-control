import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Student, StudentDocument } from '../schemas/student.schema';
import { UpdateStudentDto } from '../dto/update-student.dto';

@Injectable()
export class UpdateStudentUseCase {
  constructor(
    @InjectModel(Student.name) private readonly studentModel: Model<StudentDocument>,
  ) {}

  async execute(id: string, dto: UpdateStudentDto): Promise<StudentDocument> {
    const student = await this.studentModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }
}
