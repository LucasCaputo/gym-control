import { Module } from '@nestjs/common';
import { AsaasClient } from './asaas.client';
import { AsaasService } from './asaas.service';
import { AsaasMapper } from './asaas.mapper';
import { AppConfigService } from '../../config/config.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [AsaasClient, AsaasService, AsaasMapper, AppConfigService],
  exports: [AsaasService],
})
export class AsaasIntegrationModule {}
