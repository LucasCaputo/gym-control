import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../../../shared/types/roles.enum';

export type AdminDocument = Admin & Document;

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: false }, collection: 'admins' })
export class Admin {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, enum: Object.values(Role), default: Role.CHECKIN })
  role: Role;

  @Prop()
  createdAt: Date;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
