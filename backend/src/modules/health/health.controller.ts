import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  GameDayRunnerService,
  GameDayScenario,
  GameDayReport,
} from './gameday-runner.service';
import {
  MultiCloudDrService,
  MultiCloudDrReport,
  CloudProvider,
} from './multi-cloud-dr.service';

export class StartGameDayDrillDto {
  @ApiPropertyOptional({
    enum: GameDayScenario,
    description: 'Disaster recovery drill scenario to execute',
    default: GameDayScenario.PRIMARY_DB_CRASH,
  })
  @IsOptional()
  @IsEnum(GameDayScenario)
  scenario?: GameDayScenario;

  @ApiPropertyOptional({
    description:
      'Dry-run mode (runs verification checks without active fault delays)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;

  @ApiPropertyOptional({
    description:
      'Force drill execution if in production or restricted environment',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;

  @ApiPropertyOptional({
    description: 'Initiator identity or service name',
    default: 'ADMIN_TRIGGER',
  })
  @IsOptional()
  @IsString()
  triggeredBy?: string;

  @ApiPropertyOptional({
    description:
      'Override simulated RTO in seconds for testing and SLA validation',
  })
  @IsOptional()
  @IsNumber()
  mockRtoSeconds?: number;

  @ApiPropertyOptional({
    description:
      'Override simulated RPO in seconds for testing and SLA validation',
  })
  @IsOptional()
  @IsNumber()
  mockRpoSeconds?: number;
}

@ApiTags('admin', 'health', 'gameday')
@Controller('health')
export class HealthController {
  constructor(
    @Optional() private readonly gamedayService?: GameDayRunnerService,
    @Optional() private readonly multiCloudDrService?: MultiCloudDrService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  // --- Multi-Cloud Disaster Recovery Endpoints ---

  @Get('dr')
  @ApiOperation({
    summary:
      'Get active-active cross-cloud disaster recovery status and heartbeats',
  })
  getDrReport(): MultiCloudDrReport {
    if (!this.multiCloudDrService) {
      throw new BadRequestException('MultiCloudDrService is not available');
    }
    return this.multiCloudDrService.generateReport();
  }

  @Post('dr/failover')
  @ApiOperation({
    summary: 'Manually trigger cross-cloud DNS failover (Admin / Drill)',
  })
  async triggerFailover(
    @Body('targetCloud') targetCloud: CloudProvider,
  ): Promise<{
    success: boolean;
    targetCloud: CloudProvider;
    report: MultiCloudDrReport;
  }> {
    if (!this.multiCloudDrService) {
      throw new BadRequestException('MultiCloudDrService is not available');
    }
    const success =
      await this.multiCloudDrService.triggerDnsFailover(targetCloud);
    return {
      success,
      targetCloud,
      report: this.multiCloudDrService.generateReport(),
    };
  }

  // --- Game-Day Chaos Drill Endpoints ---

  @Post('start')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Trigger an automated disaster recovery Game-Day drill',
    description:
      'Executes a chaos drill in staging/pre-production simulating PRIMARY_DB_CRASH, REDIS_CLUSTER_SPLIT, or NETWORK_BLACKHOLE, measuring actual RTO/RPO against SLAs and generating an audit report.',
  })
  @ApiResponse({
    status: 200,
    description: 'Drill executed and compliance report generated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden in production environments without force override',
  })
  @ApiResponse({
    status: 400,
    description: 'A drill is already in progress or invalid scenario provided',
  })
  async startDrill(@Body() dto?: StartGameDayDrillDto) {
    if (!this.gamedayService) {
      throw new BadRequestException('GameDayRunnerService is not available');
    }
    return this.gamedayService.startDrill(dto ?? {});
  }

  @Get('status')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current Game-Day drill status and last report summary',
  })
  async getStatus() {
    if (!this.gamedayService) {
      throw new BadRequestException('GameDayRunnerService is not available');
    }
    return this.gamedayService.getStatus();
  }

  @Get('start')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Status query alias for drill start endpoint',
  })
  async getStartStatus() {
    if (!this.gamedayService) {
      throw new BadRequestException('GameDayRunnerService is not available');
    }
    return this.gamedayService.getStatus();
  }

  @Get('reports')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List automated compliance Game-Day audit reports',
  })
  async getReports(): Promise<{ count: number; reports: GameDayReport[] }> {
    if (!this.gamedayService) {
      throw new BadRequestException('GameDayRunnerService is not available');
    }
    const reports = this.gamedayService.getReports();
    return {
      count: reports.length,
      reports,
    };
  }

  @Get('reports/:drillId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get a specific Game-Day compliance audit report by drillId',
  })
  @ApiResponse({
    status: 200,
    description: 'Compliance report retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Report not found',
  })
  async getReportById(
    @Param('drillId') drillId: string,
  ): Promise<GameDayReport> {
    if (!this.gamedayService) {
      throw new BadRequestException('GameDayRunnerService is not available');
    }
    return this.gamedayService.getReportById(drillId);
  }

  @Post('abort')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Abort the currently active Game-Day drill',
  })
  async abortDrill() {
    if (!this.gamedayService) {
      throw new BadRequestException('GameDayRunnerService is not available');
    }
    return this.gamedayService.abortDrill();
  }
}
