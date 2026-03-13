import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Role } from '../../shared/types/roles.enum';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { CreateCheckinUseCase } from './use-cases/create-checkin.use-case';
import { GetCheckinHistoryUseCase } from './use-cases/get-checkin-history.use-case';

@Controller('checkin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CheckinController {
  constructor(
    private readonly createCheckinUseCase: CreateCheckinUseCase,
    private readonly getCheckinHistoryUseCase: GetCheckinHistoryUseCase,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.CHECKIN)
  async createCheckin(@Body() dto: CreateCheckinDto, @CurrentUser() user: any) {
    return this.createCheckinUseCase.execute(dto.studentId, user.name || user.email);
  }

  @Get('history/:studentId')
  @Roles(Role.ADMIN)
  async getHistory(
    @Param('studentId') studentId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.getCheckinHistoryUseCase.execute(
      studentId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }
}
