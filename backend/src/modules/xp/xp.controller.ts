import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { XpService } from './xp.service';
import { XpReconciliationService } from './xp-reconciliation.service';
import { XpClawbackService } from './xp-clawback.service';
import { XpAnomalyDetectorService } from './xp-anomaly-detector.service';
import { AddXpDto } from './dto/xp.dto';
import { ClawbackXpDto } from './dto/clawback.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FraudAlertStatus } from '@prisma/client';

@ApiTags('xp')
@Controller('xp')
export class XpController {
  constructor(
    private readonly xpService: XpService,
    private readonly reconciliationService: XpReconciliationService,
    @Optional() private readonly clawbackService?: XpClawbackService,
    @Optional() private readonly anomalyDetector?: XpAnomalyDetectorService,
  ) {}

  @Post('add')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add XP to a user (Admin/Internal System only)' })
  async addXp(@Request() req: any, @Body() dto: AddXpDto) {
    if (req.user?.role && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required to manually grant XP');
    }
    return this.xpService.addXp(dto);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get paginated XP transaction ledger for authenticated user',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'source', required: false, type: String })
  async getXpHistory(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('source') source?: string,
  ) {
    return this.xpService.getXpHistory(req.user.id, { page, limit, source });
  }

  @Post('reconcile/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reconcile and repair XP stat drift for authenticated user',
  })
  async reconcileSelf(@Request() req: any) {
    return this.reconciliationService.reconcileUserXp(req.user.id);
  }

  @Post('reconcile/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Run system-wide XP stat drift reconciliation (Admin only)',
  })
  async reconcileAll(@Request() req: any) {
    if (req.user?.role && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return this.reconciliationService.reconcileAllUsers();
  }

  @Get('limits')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get daily remaining gamification XP quota and velocity governor limits (#6800)',
  })
  async getXpLimits(@Request() req: any) {
    return this.xpService.getUserDailyQuota(req.user.id);
  }

  @Get('fraud-alerts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List flagged XP velocity fraud alerts (Admin only) (#6800)',
  })
  @ApiQuery({ name: 'status', enum: FraudAlertStatus, required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getFraudAlerts(
    @Request() req: any,
    @Query('status') status?: FraudAlertStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    if (req.user?.role && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required to view fraud alerts');
    }
    if (!this.anomalyDetector) {
      return { alerts: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    }
    return this.anomalyDetector.getFraudAlerts({ status, page, limit });
  }

  @Post('clawback')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Execute atomic administrative clawback on fraudulent XP (Admin only) (#6800)',
  })
  async clawbackXp(@Request() req: any, @Body() dto: ClawbackXpDto) {
    if (req.user?.role && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required to perform XP clawbacks');
    }
    if (!this.clawbackService) {
      throw new ForbiddenException('Clawback service unavailable');
    }
    return this.clawbackService.executeClawback(req.user.id, dto);
  }
}
