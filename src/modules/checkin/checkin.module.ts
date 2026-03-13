import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Checkin, CheckinSchema } from './schemas/checkin.schema';
import { Student, StudentSchema } from '../students/schemas/student.schema';
import { PaymentHistory, PaymentHistorySchema } from '../payments/schemas/payment-history.schema';
import { CheckinController } from './checkin.controller';
import { CreateCheckinUseCase } from './use-cases/create-checkin.use-case';
import { GetCheckinHistoryUseCase } from './use-cases/get-checkin-history.use-case';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Checkin.name, schema: CheckinSchema },
      { name: Student.name, schema: StudentSchema },
      { name: PaymentHistory.name, schema: PaymentHistorySchema },
    ]),
  ],
  controllers: [CheckinController],
  providers: [CreateCheckinUseCase, GetCheckinHistoryUseCase],
})
export class CheckinModule {}
