import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Role } from '../../shared/types/roles.enum';
import { RegisterStudentDto } from './dto/register-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { RegisterStudentUseCase } from './use-cases/register-student.use-case';
import { SearchStudentsUseCase } from './use-cases/search-students.use-case';
import { UpdateStudentUseCase } from './use-cases/update-student.use-case';
import { DeleteStudentUseCase } from './use-cases/delete-student.use-case';

@Controller()
export class StudentsController {
  constructor(
    private readonly registerStudentUseCase: RegisterStudentUseCase,
    private readonly searchStudentsUseCase: SearchStudentsUseCase,
    private readonly updateStudentUseCase: UpdateStudentUseCase,
    private readonly deleteStudentUseCase: DeleteStudentUseCase,
  ) {}

  @Post('public/register')
  async register(@Body() dto: RegisterStudentDto) {
    return this.registerStudentUseCase.execute(dto);
  }

  @Get('students/search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.CHECKIN)
  async search(
    @Query('q') q: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('active') active: string,
    @Query('planType') planType: string,
    @Query('financialStatus') financialStatus: string,
    @CurrentUser() user: any,
  ) {
    return this.searchStudentsUseCase.execute(
      q,
      user.role,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      active,
      planType,
      financialStatus,
    );
  }

  @Patch('admin/students/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.updateStudentUseCase.execute(id, dto);
  }

  @Delete('admin/students/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteStudentUseCase.execute(id);
  }
}
