import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;
}

export class CancelSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;
}
