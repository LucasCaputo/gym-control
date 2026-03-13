import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Admin, AdminDocument } from '../admin/schemas/admin.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<{ accessToken: string }> {
    const admin = await this.adminModel.findOne({ email }).exec();
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: (admin as any)._id.toString(),
      email: admin.email,
      role: admin.role,
      name: admin.name,
    };

    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }

  async validateUser(payload: any): Promise<any> {
    const admin = await this.adminModel.findById(payload.sub).exec();
    if (!admin) return null;
    return { id: (admin as any)._id.toString(), email: admin.email, role: admin.role, name: admin.name };
  }
}
