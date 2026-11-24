import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  Optional,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiBody, ApiResponse } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgProductivityQueryDto } from './dto/org-metrics.dto';
import type { OrgBenchmarkReportDto } from './dto/org-metrics.dto';
import { ScyllaDbTelemetryService } from './scylladb-telemetry.service';
import type {
  KeystrokeTelemetryEvent,
  TelemetryBenchmarkResult,
  ScyllaEngineStats,
} from './scylladb-telemetry.service';
import { ComplexityService } from './complexity.service';
import { GreenCarbonEstimatorService } from './green-carbon-estimator.service';
import { DebtForecasterService } from './debt-forecaster.service';
import {
  MonteCarloVelocityService,
  type HistoricalSprintDay,
  type SprintTaskRiskItem,
} from './monte-carlo-velocity.service';
import { ArchitecturalDriftService } from './architectural-drift.service';
import {
  AnalyzeArchitectureDto,
  PrArchitecturalCheckDto,
} from './dto/arch-rules.dto';
import {
  FlowStateService,
  type KeystrokeTimingEvent,
  type CompileErrorEvent,
  type FatigueCommitObservation,
} from './flow-state.service';
import {
  CodeAnalysisRequestDto,
  BatchFilesAnalysisRequestDto,
  CreateComplexitySnapshotRequestDto,
  FileComplexityDto,
  RepositoryComplexitySnapshotDto,
} from './dto/complexity.dto';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    @Optional() private readonly scyllaTelemetry?: ScyllaDbTelemetryService,
    @Optional() private readonly complexityService?: ComplexityService,
    @Optional() private readonly greenCarbonEstimator?: GreenCarbonEstimatorService,
    @Optional() private readonly monteCarloVelocity?: MonteCarloVelocityService,
    @Optional() private readonly architecturalDrift?: ArchitecturalDriftService,
    @Optional() private readonly flowStateService?: FlowStateService,
    @Optional() private readonly debtForecaster?: DebtForecasterService,
  ) {}

  @Get('platform')
  @ApiOperation({ summary: 'Get global platform statistics' })
  async getPlatformStats() {
    return this.analyticsService.getPlatformStats();
  }

  @Get('privacy-safe-aggregations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get differentially private platform statistics with epsilon budget accounting and cohort suppression',
  })
  async getPrivacySafeAggregations(
    @Request() req: { user: { id: string } },
    @Query('epsilon') epsilon?: string,
  ) {
    const parsedEpsilon = epsilon ? parseFloat(epsilon) : 1.0;
    return this.analyticsService.getPrivacySafeAggregations(
      req.user.id,
      parsedEpsilon,
    );
  }

  @Post('org/benchmark')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Generate differentially private organization productivity and benchmark report (#542)',
  })
  @ApiBody({ type: OrgProductivityQueryDto })
  async getOrgProductivityBenchmark(
    @Request() req: { user: { id: string } },
    @Body() query: OrgProductivityQueryDto,
  ): Promise<OrgBenchmarkReportDto> {
    return this.analyticsService.getOrgProductivityBenchmark(req.user.id, query);
  }

  @Get('privacy-budget/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check current privacy loss budget consumption and remaining allocation (#542)',
  })
  async getPrivacyBudgetStatus(@Request() req: { user: { id: string } }) {
    return this.analyticsService.getPrivacyBudgetStatus(req.user.id);
  }

  @Get('user/:username')
  @ApiOperation({ summary: 'Get aggregated analytics for a specific user' })
  async getUserAnalytics(@Param('username') username: string) {
    return this.analyticsService.getUserAnalytics(username);
  }

  @Get('repository/:repositoryId/commit-punchcard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a repository commit punchcard in a requested timezone' })
  async getRepositoryCommitPunchcard(
    @Request() req: { user: { id: string } },
    @Param('repositoryId') repositoryId: string,
    @Query('timezone') timezone = 'UTC',
  ) {
    return this.analyticsService.getRepositoryCommitPunchcard(req.user.id, repositoryId, timezone);
  }

  // ==========================================
  // ScyllaDB Time-Series Telemetry Endpoints
  // ==========================================

  @Get('telemetry/stats')
  @ApiOperation({
    summary: 'Get ScyllaDB / Cassandra time-series telemetry engine stats & TWCS status',
  })
  getTelemetryStats(): ScyllaEngineStats | null {
    if (!this.scyllaTelemetry) return null;
    return this.scyllaTelemetry.getStats();
  }

  @Get('telemetry/benchmark')
  @ApiOperation({
    summary:
      'Benchmark ScyllaDB unlogged batch write throughput (validating 20,000+ events/sec & sub-5ms ack)',
  })
  @ApiQuery({ name: 'events', required: false, type: Number })
  async runTelemetryBenchmark(
    @Query('events') events?: string,
  ): Promise<TelemetryBenchmarkResult | null> {
    if (!this.scyllaTelemetry) return null;
    const count = events ? parseInt(events, 10) : 25000;
    return this.scyllaTelemetry.runWriteBenchmark(isNaN(count) ? 25000 : count);
  }

  @Get('telemetry/keystrokes/:battleId')
  @ApiOperation({
    summary: 'Stream ordered keystroke and cursor time-series events for battle replay',
  })
  @ApiParam({ name: 'battleId', description: 'Battle UUID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getBattleTelemetry(
    @Param('battleId') battleId: string,
    @Query('limit') limit?: string,
  ): Promise<KeystrokeTelemetryEvent[]> {
    if (!this.scyllaTelemetry) return [];
    const lim = limit ? parseInt(limit, 10) : undefined;
    return this.scyllaTelemetry.getBattleTimeline(battleId, { limit: lim });
  }

  @Post('telemetry/keystrokes/batch')
  @ApiOperation({
    summary: 'Asynchronously ingest unlogged batch of keystroke telemetry events',
  })
  @ApiBody({ description: 'Array of telemetry events' })
  async ingestTelemetryBatch(
    @Body() events: KeystrokeTelemetryEvent[],
  ): Promise<{ ingestedCount: number; ack: boolean }> {
    if (!this.scyllaTelemetry) return { ingestedCount: 0, ack: false };
    const count = this.scyllaTelemetry.recordTelemetryEventsBulk(events);
    return { ingestedCount: count, ack: true };
  }

  // ==========================================
  // Cyclomatic & Halstead Complexity Endpoints (#365)
  // ==========================================

  @Post('complexity/analyze-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Analyze Cyclomatic & Halstead code complexity with refactoring advice for code snippet',
    description:
      'Parses TypeScript, JavaScript, or Python code into AST, computing Cyclomatic Complexity (M = E - N + 2P), Halstead Volume, and Maintainability Index (MI), flagging refactoring hotspots (Complexity > 15, MI < 65).',
  })
  @ApiResponse({ status: 200, type: FileComplexityDto })
  async analyzeCodeComplexity(@Body() dto: CodeAnalysisRequestDto): Promise<FileComplexityDto> {
    if (!this.complexityService) {
      throw new Error('ComplexityService not available');
    }
    return this.complexityService.analyzeCode(dto);
  }

  @Post('complexity/analyze-files')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Analyze a batch of source files for repository-wide complexity hotspots',
  })
  async analyzeBatchFiles(@Body() dto: BatchFilesAnalysisRequestDto) {
    if (!this.complexityService) {
      throw new Error('ComplexityService not available');
    }
    return this.complexityService.analyzeBatch(dto.files || []);
  }

  @Post('repository/:repositoryId/complexity/snapshot')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generate and persist a complexity snapshot for a repository',
  })
  @ApiParam({ name: 'repositoryId', description: 'Repository UUID' })
  async createRepositoryComplexitySnapshot(
    @Param('repositoryId') repositoryId: string,
    @Body() dto: CreateComplexitySnapshotRequestDto,
  ): Promise<RepositoryComplexitySnapshotDto> {
    if (!this.complexityService) {
      throw new Error('ComplexityService not available');
    }
    return this.complexityService.createRepositorySnapshot(
      repositoryId,
      `repo-${repositoryId}`,
      dto.files || [],
      dto.branch || 'main',
      dto.commitSha,
    );
  }

  @Get('repository/:repositoryId/complexity/latest')
  @ApiOperation({
    summary: 'Get latest complexity snapshot for a repository',
  })
  @ApiParam({ name: 'repositoryId', description: 'Repository UUID' })
  async getLatestRepositoryComplexity(
    @Param('repositoryId') repositoryId: string,
  ): Promise<RepositoryComplexitySnapshotDto | null> {
    if (!this.complexityService) {
      throw new Error('ComplexityService not available');
    }
    return this.complexityService.getLatestSnapshot(repositoryId);
  }

  @Get('repository/:repositoryId/complexity/hotspots')
  @ApiOperation({
    summary: 'Get high-risk cognitive and cyclomatic complexity hotspots requiring refactoring',
  })
  @ApiParam({ name: 'repositoryId', description: 'Repository UUID' })
  async getRepositoryHotspots(@Param('repositoryId') repositoryId: string) {
    if (!this.complexityService) {
      throw new Error('ComplexityService not available');
    }
    return this.complexityService.getHotspots(repositoryId);
  }

  // ==========================================
  // Green Software Carbon & Energy Endpoints (#597)
  // ==========================================

  @Get('green-carbon/regions')
  @ApiOperation({ summary: 'List cloud regional grid carbon intensity factors (gCO2eq/kWh)' })
  getGreenCarbonRegions() {
    return this.greenCarbonEstimator?.getSupportedRegions() ?? [];
  }

  @Post('green-carbon/estimate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Estimate execution energy (mJ/kWh), CO2 grams, O(N^2) energy hotspots, and Green Code badge',
  })
  estimateExecutionCarbon(
    @Body()
    body: {
      runId: string;
      repositoryId: string;
      region?: string;
      cpuEnergyMj: number;
      dramEnergyMj: number;
      durationMs: number;
      sourceCode?: string;
      baselineEnergyMj?: number;
    },
  ) {
    return this.greenCarbonEstimator?.estimateExecutionCarbon(body);
  }

  @Post('green-carbon/parse-perf')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Parse Linux AMD/Intel perf stat energy counters into mJ and kWh' })
  parsePerfCounters(@Body() body: { perfOutput: string; durationMs: number }) {
    return this.greenCarbonEstimator?.parsePerfStatEnergyOutput(
      body.perfOutput,
      body.durationMs,
    );
  }

  @Get('green-carbon/repository/:repositoryId')
  @ApiOperation({ summary: 'Get repository cumulative carbon footprint and Green Code badge summary' })
  getRepositoryCarbonSummary(@Param('repositoryId') repositoryId: string) {
    return this.greenCarbonEstimator?.getRepositoryCarbonSummary(repositoryId);
  }

  // Monte Carlo Sprint Velocity & Burndown Endpoints (#595)
  // ==========================================

  @Post('velocity/monte-carlo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Run 10,000 Monte Carlo sprint burndown simulations for P50, P85, and P95 delivery forecasts',
  })
  runMonteCarloVelocityForecast(
    @Body()
    body: {
      remainingTasks: number;
      history: HistoricalSprintDay[];
      iterations?: number;
      startDateIso?: string;
      targetDeadlineIso?: string;
      backlogTasks?: SprintTaskRiskItem[];
    },
  ) {
    return this.monteCarloVelocity?.runMonteCarloForecast(body);
  }
  // Architectural Drift & Boundary Violation Endpoints (#592)
  // ==========================================

  @Post('architecture/analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Analyze module dependency graph for circular cycles (Johnson algorithm) and boundary violations',
  })
  analyzeArchitecturalDrift(@Body() dto: AnalyzeArchitectureDto) {
    return this.architecturalDrift?.analyzeArchitecture(dto.files, dto.rules);
  }

  @Post('architecture/pr-check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Evaluate PR diff against architectural boundaries and block new cyclic dependencies',
  })
  evaluateArchitecturalPrGate(@Body() dto: PrArchitecturalCheckDto) {
    return this.architecturalDrift?.evaluatePullRequestGate(
      dto.baseFiles,
      dto.headFiles,
      dto.rules,
    );
  }
  // Developer Flow State & Cognitive Fatigue Endpoints (#589)
  // ==========================================

  @Post('flow-state/analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Analyze keystroke fluidity, compile error loops, and cognitive fatigue index (<10ms)',
  })
  async analyzeDeveloperFlowState(
    @Body()
    body: {
      userId?: string;
      repositoryId?: string;
      keystrokes: KeystrokeTimingEvent[];
      compileErrors?: CompileErrorEvent[];
      continuousSessionMinutes?: number;
      persistSnapshot?: boolean;
    },
  ) {
    if (!this.flowStateService) return null;
    const analysis = this.flowStateService.analyzeTelemetryBatch(body);
    if (body.persistSnapshot && body.userId) {
      await this.flowStateService.persistRollingSnapshot({
        userId: body.userId,
        repositoryId: body.repositoryId,
        analysis,
      });
    }
    return analysis;
  }

  @Post('flow-state/correlate-bugs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Correlate cognitive fatigue levels with historical bug/revert insertion rates',
  })
  correlateFatigueBugs(@Body() body: { observations: FatigueCommitObservation[] }) {
    return this.flowStateService?.correlateFatigueWithBugRate(body.observations ?? []);
  }

  // ==========================================
  // Predictive Technical Debt & Code Maintainability Degradation Forecast Engine (#446)
  // ==========================================

  @Get('repositories/:id/tech-debt-forecast')
  @ApiOperation({
    summary: 'Predictive technical debt and code maintainability degradation forecast engine (#446)',
  })
  @ApiParam({ name: 'id', description: 'Repository ID' })
  async getRepositoryTechDebtForecast(@Param('id') repositoryId: string) {
    if (!this.debtForecaster) {
      throw new BadRequestException('DebtForecasterService is unavailable');
    }
    return this.debtForecaster.getTechDebtForecast(repositoryId);
  }
}
