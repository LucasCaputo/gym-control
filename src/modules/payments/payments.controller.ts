import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { Role } from '../../shared/types/roles.enum';
import { CreateSubscriptionDto, CancelSubscriptionDto } from './dto/create-subscription.dto';
import { CreateSubscriptionUseCase } from './use-cases/create-subscription.use-case';
import { CancelSubscriptionUseCase } from './use-cases/cancel-subscription.use-case';
import { GetStudentPaymentsUseCase } from './use-cases/get-student-payments.use-case';
import { UpdateCardUseCase } from './use-cases/update-card.use-case';

@Controller('admin/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class PaymentsController {
  constructor(
    private readonly createSubscriptionUseCase: CreateSubscriptionUseCase,
    private readonly cancelSubscriptionUseCase: CancelSubscriptionUseCase,
    private readonly getStudentPaymentsUseCase: GetStudentPaymentsUseCase,
    private readonly updateCardUseCase: UpdateCardUseCase,
  ) {}

  @Post('create-subscription')
  async createSubscription(@Body() dto: CreateSubscriptionDto) {
    return this.createSubscriptionUseCase.execute(dto.studentId);
  }

  @Post('cancel-subscription')
  async cancelSubscription(@Body() dto: CancelSubscriptionDto) {
    return this.cancelSubscriptionUseCase.execute(dto.studentId);
  }

  @Get('student/:studentId')
  async getStudentPayments(
    @Param('studentId') studentId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.getStudentPaymentsUseCase.execute(
      studentId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Post('update-card/:studentId')
  async updateCard(@Param('studentId') studentId: string) {
    return this.updateCardUseCase.execute(studentId);
  }
}
