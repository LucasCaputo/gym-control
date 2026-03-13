import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentHistory, PaymentHistorySchema } from './schemas/payment-history.schema';
import { Student, StudentSchema } from '../students/schemas/student.schema';
import { PaymentsController } from './payments.controller';
import { CreateSubscriptionUseCase } from './use-cases/create-subscription.use-case';
import { CancelSubscriptionUseCase } from './use-cases/cancel-subscription.use-case';
import { GetStudentPaymentsUseCase } from './use-cases/get-student-payments.use-case';
import { UpdateCardUseCase } from './use-cases/update-card.use-case';
import { AsaasIntegrationModule } from '../../integrations/asaas/asaas.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentHistory.name, schema: PaymentHistorySchema },
      { name: Student.name, schema: StudentSchema },
    ]),
    AsaasIntegrationModule,
  ],
  controllers: [PaymentsController],
  providers: [
    CreateSubscriptionUseCase,
    CancelSubscriptionUseCase,
    GetStudentPaymentsUseCase,
    UpdateCardUseCase,
  ],
  exports: [MongooseModule],
})
export class PaymentsModule {}
