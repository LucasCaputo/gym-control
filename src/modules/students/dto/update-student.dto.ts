import { IsBoolean, IsEmail, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { FinancialStatus, PlanType } from '../../../shared/types/financial-status.enum';

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyFee?: number;

  @IsOptional()
  @IsEnum(PlanType)
  planType?: PlanType;

  @IsOptional()
  @IsEnum(FinancialStatus)
  financialStatus?: FinancialStatus;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
