import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Student, StudentSchema } from '../students/schemas/student.schema';
import { PaymentHistory, PaymentHistorySchema } from '../payments/schemas/payment-history.schema';
import { WebhooksController } from './webhooks.controller';
import { ProcessWebhookUseCase } from './use-cases/process-webhook.use-case';
import { AppConfigService } from '../../config/config.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Student.name, schema: StudentSchema },
      { name: PaymentHistory.name, schema: PaymentHistorySchema },
    ]),
  ],
  controllers: [WebhooksController],
  providers: [ProcessWebhookUseCase, AppConfigService],
})
export class WebhooksModule {}
