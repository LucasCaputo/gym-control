import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AppConfigService } from '../../config/config.service';
import { ProcessWebhookUseCase } from './use-cases/process-webhook.use-case';
import { AsaasWebhookDto } from './dto/webhook.dto';

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
    @Body() body: AsaasWebhookDto,
  ) {
    if (token !== this.configService.asaasWebhookToken) {
      this.logger.warn('[Webhook] Rejected request with invalid token');
      throw new UnauthorizedException('Invalid webhook token');
    }

    await this.processWebhookUseCase.execute(body);
    return { received: true };
  }
}
