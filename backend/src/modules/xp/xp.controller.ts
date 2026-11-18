import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { XpService } from './xp.service';
import { XpReconciliationService } from './xp-reconciliation.service';
import { AddXpDto } from './dto/xp.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('xp')
@Controller('xp')
export class XpController {
  constructor(
    private readonly xpService: XpService,
    private readonly reconciliationService: XpReconciliationService,
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
}
