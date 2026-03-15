import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Student, StudentSchema } from './schemas/student.schema';
import { PaymentHistory, PaymentHistorySchema } from '../payments/schemas/payment-history.schema';
import { Checkin, CheckinSchema } from '../checkin/schemas/checkin.schema';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { RegisterStudentUseCase } from './use-cases/register-student.use-case';
import { SearchStudentsUseCase } from './use-cases/search-students.use-case';
import { UpdateStudentUseCase } from './use-cases/update-student.use-case';
import { DeleteStudentUseCase } from './use-cases/delete-student.use-case';
import { AsaasIntegrationModule } from '../../integrations/asaas/asaas.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Student.name, schema: StudentSchema },
      { name: PaymentHistory.name, schema: PaymentHistorySchema },
      { name: Checkin.name, schema: CheckinSchema },
    ]),
    AsaasIntegrationModule,
  ],
  controllers: [StudentsController],
  providers: [
    StudentsService,
    RegisterStudentUseCase,
    SearchStudentsUseCase,
    UpdateStudentUseCase,
    DeleteStudentUseCase,
  ],
  exports: [StudentsService, MongooseModule],
})
export class StudentsModule {}
