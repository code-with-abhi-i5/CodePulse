import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class ClawbackXpDto {
  @ApiProperty({ description: 'ID of the user to claw back XP from' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Positive integer amount of XP to claw back' })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'Audit rationale for administrative clawback' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ description: 'Associated fraud alert ID if resolving a flag' })
  @IsOptional()
  @IsString()
  fraudAlertId?: string;

  @ApiPropertyOptional({ default: 'ADMIN_CLAWBACK' })
  @IsOptional()
  @IsString()
  source?: string;
}
