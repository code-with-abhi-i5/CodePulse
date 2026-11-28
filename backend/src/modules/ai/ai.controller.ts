import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TranspilerService } from './transpiler.service';
import { PrAnalyzerService, PrAnalysisResult } from './pr-analyzer.service';
import { ChangelogGeneratorService } from './changelog-generator.service';
import {
  CodeReviewerService,
  CommitReviewSummary,
  FindingStatus,
} from './code-reviewer.service';
import { ReviewCommitRequestDto } from './dto/review-commit.dto';
import { PersonaBattleService } from './persona-battle.service';
import { CodeHintService } from './code-hint.service';
import {
  PolyglotTranspilerService,
  type PolyglotTranspileRequest,
} from './transpiler/polyglot-transpiler.service';
import { RequestHintDto, HintResponseDto } from './dto/code-hint.dto';
import { ReproSynthesizerService } from './repro-synthesizer.service';
import { SyntheticBenchmarkService } from './synthetic-benchmark.service';
import {
  BenchmarkGeneratorService,
  type AlgorithmConstraint,
} from './benchmark-generator.service';
import {
  GenerateBenchmarkRequestDto,
  GenerateBenchmarkResponseDto,
  ExecuteBenchmarkRequestDto,
  BenchmarkExecutionResultDto,
} from './dto/benchmark-request.dto';
import {
  SynthesizeReproRequestDto,
  SynthesizedReproResponseDto,
  TrackReproExecutionDto,
  ReproStatsDto,
} from './dto/repro-synthesizer.dto';
import {
  TranspileRequestDto,
  TranspileResponseDto,
  SupportedLanguage,
} from './dto/transpiler.dto';
import {
  GenerateChangelogRequestDto,
  ChangelogResponseDto,
} from './dto/changelog.dto';
import { ScaffoldSynthesizerService } from './scaffold-synthesizer.service';
import {
  ScaffoldFromDiagramDto,
  ScaffoldFromDiagramResponseDto,
} from './dto/scaffold-synthesizer.dto';
import {
  AiPersonaDto,
  StartPracticeBattleRequestDto,
  PracticeBattleResponseDto,
  SimulateKeystrokesRequestDto,
  FinishPracticeMatchDto,
  FinishPracticeMatchResponseDto,
} from './dto/persona-battle.dto';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(
    private readonly transpilerService: TranspilerService,
    private readonly prAnalyzer: PrAnalyzerService,
    private readonly codeReviewer: CodeReviewerService,
    private readonly changelogGenerator: ChangelogGeneratorService,
    private readonly personaBattleService: PersonaBattleService,
    private readonly codeHintService: CodeHintService,
    private readonly polyglotTranspiler?: PolyglotTranspilerService,
    @Optional() private readonly reproSynthesizer?: ReproSynthesizerService,
    @Optional() private readonly syntheticBenchmark?: SyntheticBenchmarkService,
    @Optional() private readonly benchmarkGenerator?: BenchmarkGeneratorService,
    @Optional() private readonly scaffoldSynthesizer?: ScaffoldSynthesizerService,
  ) {}

  @Post('transpile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Automated polyglot code transpiler & idiomatic language migration engine',
    description:
      'Transpiles algorithms across TypeScript, Python, Go, and Rust while preserving target language idioms, generating starter code stubs, and verifying output equivalence against reference tests.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully transpiled and verified polyglot code',
    type: TranspileResponseDto,
  })
  async transpileCode(@Body() dto: TranspileRequestDto): Promise<TranspileResponseDto> {
    if (!dto.sourceCode || !dto.sourceLanguage || !dto.targetLanguage) {
      throw new BadRequestException('sourceCode, sourceLanguage, and targetLanguage are required');
    }
    return this.transpilerService.transpile(dto);
  }

  @Post('analyze-pr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'AI pull request quality, convention, and test coverage analyzer' })
  async analyzePr(@Body() prDetails: any): Promise<PrAnalysisResult> {
    return this.prAnalyzer.analyzePullRequest(prDetails);
  }

  @Post('review-commit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'AST-Based Automated Code Review & Security Vulnerability Advisor',
    description:
      'Performs AST static security analysis on repository commits for OWASP Top 10 vulnerabilities (SQLi, XSS, ReDoS, insecure crypto, hardcoded secrets) and generates inline annotations with fix suggestions.',
  })
  async reviewCommit(@Body() dto: ReviewCommitRequestDto): Promise<CommitReviewSummary> {
    if (!dto.commitSha) {
      throw new BadRequestException('commitSha is required');
    }
    return this.codeReviewer.reviewCommit(dto);
  }

  @Get('findings/:commitSha')
  @ApiOperation({ summary: 'Get code review security findings for a specific commit' })
  async getCommitFindings(@Param('commitSha') commitSha: string) {
    return this.codeReviewer.getFindingsForCommit(commitSha);
  }

  @Patch('findings/:id/status')
  @ApiOperation({ summary: 'Update resolution status of a code review security finding' })
  async updateFindingStatus(
    @Param('id') id: string,
    @Body() body: { status: FindingStatus },
  ) {
    if (!body.status) {
      throw new BadRequestException('status is required (OPEN, RESOLVED, IGNORED)');
    }
    return this.codeReviewer.updateFindingStatus(id, body.status);
  }

  @Post('generate-changelog')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Automated PR changelog & release notes generator via LLM',
    description:
      'Aggregates merged pull requests within a tag range, categorizes them into Conventional Commits SemVer sections, extracts breaking change migration advice, and formats GitHub Release markdown with contributor attribution.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully generated release changelog and release notes',
    type: ChangelogResponseDto,
  })
  async generateChangelog(
    @Body() dto: GenerateChangelogRequestDto,
  ): Promise<ChangelogResponseDto> {
    return this.changelogGenerator.generateChangelog(dto);
  }

  // ==========================================
  // Historical Programmer Persona Battles (#366)
  // ==========================================

  @Get('personas')
  @ApiOperation({
    summary: 'List available historical programmer AI personas (Lovelace, Turing, Carmack, Hamilton)',
    description:
      'Retrieves calibrated AI personas with distinct coding styles, typing speeds (WPM), Elo ratings, and difficulty tiers for practice battles.',
  })
  @ApiResponse({ status: 200, type: [AiPersonaDto] })
  async getPersonas(): Promise<AiPersonaDto[]> {
    return this.personaBattleService.getAvailablePersonas();
  }

  @Get('personas/:personaId')
  @ApiOperation({ summary: 'Retrieve specific AI persona details' })
  @ApiParam({ name: 'personaId', description: 'Persona ID (lovelace, turing, carmack, hamilton)' })
  @ApiResponse({ status: 200, type: AiPersonaDto })
  async getPersona(@Param('personaId') personaId: string): Promise<AiPersonaDto> {
    return this.personaBattleService.getPersonaById(personaId);
  }

  @Post('personas/practice-battle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Instant matchmaking solo practice battle against an AI historical programmer persona',
    description:
      'Instantly creates (< 2 seconds) an active solo practice battle session against a legendary programmer persona matching user Elo rating.',
  })
  @ApiResponse({ status: 200, type: PracticeBattleResponseDto })
  async startPracticeBattle(
    @Body() dto: StartPracticeBattleRequestDto,
  ): Promise<PracticeBattleResponseDto> {
    if (!dto.userId) {
      throw new BadRequestException('userId is required to initiate a practice match');
    }
    return this.personaBattleService.startPracticeBattle(dto);
  }

  @Post('personas/simulate-keystrokes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simulate natural human typing cadence and keystroke stream for an AI persona',
    description:
      'Generates keystroke frames with micro-delays (150ms-400ms), thinking pauses, and realistic typo corrections.',
  })
  async simulateKeystrokes(@Body() dto: SimulateKeystrokesRequestDto) {
    return this.personaBattleService.simulateKeystrokes(dto);
  }

  @Post('personas/finish-match')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Conclude solo practice match against AI persona and award unranked practice XP',
  })
  @ApiResponse({ status: 200, type: FinishPracticeMatchResponseDto })
  async finishPracticeMatch(
    @Body() dto: FinishPracticeMatchDto,
  ): Promise<FinishPracticeMatchResponseDto> {
    return this.personaBattleService.finishPracticeBattle(dto);
  }

  @Post('battles/hint')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Progressive AI code hint engine with time-decay XP penalty for battles',
    description:
      'Provides 3 progressive hint tiers (Tier 1 Conceptual, Tier 2 Pseudocode, Tier 3 Edge-Cases) with strict solution-leak guardrails and a 2-minute rate limit.',
  })
  @ApiResponse({
    status: 200,
    description: 'Formatted markdown hint with XP penalty details',
    type: HintResponseDto,
  })
  async requestBattleHint(@Body() dto: RequestHintDto): Promise<HintResponseDto> {
    return this.codeHintService.requestHint(dto);
  }

  @Post('polyglot-transpile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Transpile algorithms across TypeScript, Python, Go, Rust, and C++ with unit tests',
  })
  async transpilePolyglot(@Body() dto: PolyglotTranspileRequest) {
    if (!this.polyglotTranspiler) {
      throw new BadRequestException('PolyglotTranspilerService unavailable');
    }
    return this.polyglotTranspiler.transpileAndVerify(dto);
  }

  // ==========================================
  // Bug Reproduction Script Synthesizer (#369)
  // ==========================================

  @Post('repro/synthesize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Synthesize automated bug reproduction script from GitHub issue (#369)',
    description:
      'Extracts reproduction steps, expected/actual behaviors, and environment metadata from issue text to generate a standalone reproduction script (Node.js/Python/Bash) in a containerized Docker runner.',
  })
  @ApiResponse({
    status: 200,
    description: 'Synthesized reproduction script with syntax validation and Docker runner command',
    type: SynthesizedReproResponseDto,
  })
  async synthesizeReproduction(
    @Body() dto: SynthesizeReproRequestDto,
  ): Promise<SynthesizedReproResponseDto> {
    if (!dto.issueBody) {
      throw new BadRequestException('issueBody is required to synthesize a reproduction script');
    }
    if (!this.reproSynthesizer) {
      throw new BadRequestException('ReproSynthesizerService is not available');
    }
    return this.reproSynthesizer.synthesizeReproductionScript(dto);
  }

  @Get('repro/stats')
  @ApiOperation({
    summary: 'Retrieve reproduction synthesis success rates and analytics (#369)',
  })
  @ApiResponse({
    status: 200,
    description: 'Aggregated reproduction statistics, syntax validity rates, and language breakdown',
    type: ReproStatsDto,
  })
  async getReproStats(): Promise<ReproStatsDto> {
    if (!this.reproSynthesizer) {
      throw new BadRequestException('ReproSynthesizerService is not available');
    }
    return this.reproSynthesizer.getReproStats();
  }

  @Post('repro/:id/track')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Track reproduction execution outcome (success/failure) for analytics (#369)',
  })
  @ApiParam({ name: 'id', description: 'Reproduction run ID' })
  @ApiResponse({
    status: 200,
    description: 'Updated reproduction record with execution outcome',
    type: SynthesizedReproResponseDto,
  })
  async trackReproExecution(
    @Param('id') id: string,
    @Body() dto: TrackReproExecutionDto,
  ): Promise<SynthesizedReproResponseDto> {
    if (!this.reproSynthesizer) {
      throw new BadRequestException('ReproSynthesizerService is not available');
    }
    return this.reproSynthesizer.trackExecutionResult(id, dto);
  }

  @Post('benchmarks/generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate synthetic k6 load testing scenarios from OpenAPI / Swagger specifications (#527)',
    description:
      'Parses OpenAPI 3.0 / Swagger endpoint schemas, synthesizes realistic dummy payloads, and outputs production-ready k6 load test scripts with threshold assertions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Generated executable k6 benchmark scenario',
    type: GenerateBenchmarkResponseDto,
  })
  async generateBenchmark(
    @Body() dto: GenerateBenchmarkRequestDto,
  ): Promise<GenerateBenchmarkResponseDto> {
    if (!this.syntheticBenchmark) {
      throw new BadRequestException('SyntheticBenchmarkService is not available');
    }
    return this.syntheticBenchmark.generateBenchmark(dto);
  }

  @Post('benchmarks/execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute or simulate sandboxed k6 stress-testing benchmark scenario (#527)',
  })
  @ApiResponse({
    status: 200,
    description: 'Benchmark execution result with throughput timeline and latency percentiles',
    type: BenchmarkExecutionResultDto,
  })
  async executeBenchmark(
    @Body() dto: ExecuteBenchmarkRequestDto,
  ): Promise<BenchmarkExecutionResultDto> {
    if (!this.syntheticBenchmark) {
      throw new BadRequestException('SyntheticBenchmarkService is not available');
    }
    return this.syntheticBenchmark.executeBenchmark(dto);
  }

  @Get('benchmarks/:id')
  @ApiOperation({
    summary: 'Retrieve saved benchmark script by ID (#527)',
  })
  @ApiParam({ name: 'id', description: 'Benchmark ID' })
  async getBenchmark(@Param('id') id: string) {
    if (!this.syntheticBenchmark) {
      throw new BadRequestException('SyntheticBenchmarkService is not available');
    }
    return this.syntheticBenchmark.getBenchmark(id);
  }

  // ==========================================
  // Automated Synthetic Benchmarking & Extreme Stress-Test Scenario Generator (#445)
  // ==========================================

  @Post('adversarial-benchmarks/generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate synthetic extreme adversarial benchmark suite for an algorithm challenge (#445)',
  })
  async generateAdversarialBenchmarks(
    @Body()
    body: {
      challengeId: string;
      description: string;
      constraints?: Partial<AlgorithmConstraint>;
      store?: boolean;
    },
  ) {
    if (!this.benchmarkGenerator) {
      throw new BadRequestException('BenchmarkGeneratorService is unavailable');
    }
    if (!body.challengeId) {
      throw new BadRequestException('challengeId is required');
    }
    const analyzed = this.benchmarkGenerator.analyzeConstraints(
      body.description || '',
      body.constraints,
    );
    const suite = this.benchmarkGenerator.generateAdversarialSuite(
      body.challengeId,
      analyzed,
    );
    if (body.store !== false) {
      await this.benchmarkGenerator.storeChallengeBenchmark(suite);
    }
    return suite;
  }

  @Post('adversarial-benchmarks/evaluate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Evaluate code against extreme adversarial benchmark inputs and reject sub-optimal Big-O complexity (#445)',
  })
  async evaluateAlgorithmAgainstBenchmarks(
    @Body()
    body: {
      challengeId: string;
      sourceCode: string;
      description?: string;
      constraints?: Partial<AlgorithmConstraint>;
    },
  ) {
    if (!this.benchmarkGenerator) {
      throw new BadRequestException('BenchmarkGeneratorService is unavailable');
    }
    if (!body.challengeId || !body.sourceCode) {
      throw new BadRequestException('challengeId and sourceCode are required');
    }
    const analyzed = this.benchmarkGenerator.analyzeConstraints(
      body.description || '',
      body.constraints,
    );
    return this.benchmarkGenerator.evaluateAlgorithmAgainstBenchmarks(
      body.challengeId,
      body.sourceCode,
      analyzed,
    );
  }

  @Get('adversarial-benchmarks/:challengeId')
  @ApiOperation({
    summary: 'Retrieve stored adversarial benchmark suite for a challenge (#445)',
  })
  @ApiParam({ name: 'challengeId', description: 'Challenge Identifier' })
  async getAdversarialBenchmarks(@Param('challengeId') challengeId: string) {
    if (!this.benchmarkGenerator) {
      throw new BadRequestException('BenchmarkGeneratorService is unavailable');
    }
    return this.benchmarkGenerator.getChallengeBenchmark(challengeId);
  }

  @Post('scaffold-from-diagram')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Architecture Diagram-to-Code Scaffolding Synthesizer',
    description:
      'Parses Mermaid.js class diagrams or flowcharts into entity-relationship graphs and generates complete NestJS module hierarchy (Module, Controller, Service, DTOs with class-validator) and Prisma schemas with optional zip download or GitHub branch commit.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully synthesized NestJS architecture hierarchy and schema',
    type: ScaffoldFromDiagramResponseDto,
  })
  async scaffoldFromDiagram(
    @Body() dto: ScaffoldFromDiagramDto,
  ): Promise<ScaffoldFromDiagramResponseDto> {
    if (!this.scaffoldSynthesizer) {
      throw new BadRequestException('ScaffoldSynthesizerService is unavailable');
    }
    return this.scaffoldSynthesizer.synthesizeFromDiagram(dto);
  }
}



