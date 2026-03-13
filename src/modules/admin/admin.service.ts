import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Admin, AdminDocument } from './schemas/admin.schema';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
  ) {}

  async createAdmin(dto: CreateAdminDto): Promise<AdminDocument> {
    const existing = await this.adminModel.findOne({ email: dto.email }).exec();
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.adminModel.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role,
    });
  }

  async listAdmins(): Promise<AdminDocument[]> {
    return this.adminModel.find({}, { passwordHash: 0 }).exec();
  }
}
