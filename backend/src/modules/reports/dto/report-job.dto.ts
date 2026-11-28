import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ReportFormat, ReportScope } from '@prisma/client';

export class CreateReportJobDto {
  @ApiPropertyOptional({
    enum: ReportScope,
    default: ReportScope.INDIVIDUAL,
    description: 'Scope of the report (INDIVIDUAL, TEAM, SYSTEM)',
  })
  @IsOptional()
  @IsEnum(ReportScope)
  scope?: ReportScope;

  @ApiPropertyOptional({
    description: 'Target developer username or team identifier (optional)',
  })
  @IsOptional()
  @IsString()
  targetId?: string;

  @ApiPropertyOptional({
    enum: ReportFormat,
    default: ReportFormat.JSON,
    description: 'Output format (JSON, CSV, PDF)',
  })
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat;

  @ApiPropertyOptional({
    description: 'Timeframe in days for metric aggregation (1 to 365)',
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  timeframeDays?: number;
}

export class ReportJobResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  requestedById: string;

  @ApiProperty({ enum: ReportScope })
  scope: ReportScope;

  @ApiPropertyOptional()
  targetId?: string | null;

  @ApiProperty({ enum: ReportFormat })
  format: ReportFormat;

  @ApiProperty()
  status: string;

  @ApiProperty()
  timeframeDays: number;

  @ApiPropertyOptional()
  fileSizeBytes?: number | null;

  @ApiPropertyOptional()
  sha256Checksum?: string | null;

  @ApiPropertyOptional()
  downloadUrl?: string | null;

  @ApiPropertyOptional()
  tokenExpiresAt?: Date | null;

  @ApiPropertyOptional()
  errorMessage?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date | null;
}
