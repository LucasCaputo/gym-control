import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CheckinDocument = Checkin & Document;

@Schema({ timestamps: false, collection: 'checkins' })
export class Checkin {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Student', index: true })
  studentId: Types.ObjectId;

  @Prop({ required: true, index: true })
  dateTime: Date;

  @Prop({ required: true })
  registeredBy: string;
}

export const CheckinSchema = SchemaFactory.createForClass(Checkin);
