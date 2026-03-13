import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Checkin, CheckinDocument } from '../schemas/checkin.schema';

@Injectable()
export class GetCheckinHistoryUseCase {
  constructor(
    @InjectModel(Checkin.name) private readonly checkinModel: Model<CheckinDocument>,
  ) {}

  async execute(studentId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const filter = { studentId: new Types.ObjectId(studentId) };

    const [data, total] = await Promise.all([
      this.checkinModel.find(filter).sort({ dateTime: -1 }).skip(skip).limit(limit).exec(),
      this.checkinModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }
}
