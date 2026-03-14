import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { AppConfigService } from '../../config/config.service';
import { ProcessWebhookUseCase } from './use-cases/process-webhook.use-case';
import { AsaasWebhookDto } from './dto/webhook.dto';

/** Valida apenas campos conhecidos e ignora o resto, evitando 400 em eventos não mapeados (ex.: antecipação, transfer, bill). */
const asaasWebhookPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: false,
  transform: true,
});

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly configService: AppConfigService,
    private readonly processWebhookUseCase: ProcessWebhookUseCase,
  ) {}

  @Post('asaas')
  @HttpCode(HttpStatus.OK)
  async handleAsaasWebhook(
    @Headers('asaas-access-token') token: string,
    @Body(asaasWebhookPipe) body: AsaasWebhookDto,
  ) {
    if (token !== this.configService.asaasWebhookToken) {
      this.logger.warn('[Webhook] Rejected request with invalid token');
      throw new UnauthorizedException('Invalid webhook token');
    }

    await this.processWebhookUseCase.execute(body);
    return { received: true };
  }
}
