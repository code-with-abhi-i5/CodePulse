import { Module, forwardRef } from '@nestjs/common';
import { AiController } from './ai.controller';
import { TranspilerService } from './transpiler.service';
import { PrAnalyzerService } from './pr-analyzer.service';
import { CodeReviewerService } from './code-reviewer.service';
import { ChangelogGeneratorService } from './changelog-generator.service';
import { PersonaBattleService } from './persona-battle.service';
import { CodeHintService } from './code-hint.service';
import { VectorService } from './vector.service';

import { VerificationCoordinatorService } from './swarm/verification-coordinator.service';
import { VerificationSwarmService } from './verification-swarm.service';

import { ComplexityAnalyzerService } from './complexity-analyzer.service';
import { MultiAgentReviewerService } from './agents/pr-reviewer.service';
import { DocEvaluatorService } from './doc-evaluator.service';
import { VoiceCodeAssistantGateway } from './voice-code-assistant.gateway';
import { TestGeneratorService } from './test-generator.service';
import { PolyglotTranspilerService } from './transpiler/polyglot-transpiler.service';
import { SemanticConflictResolverService } from '../git/semantic-conflict-resolver.service';
import { GitService } from '../git/git.service';
import { ReproSynthesizerService } from './repro-synthesizer.service';
import { SyntheticBenchmarkService } from './synthetic-benchmark.service';
import { BenchmarkGeneratorService } from './benchmark-generator.service';
import { ScaffoldSynthesizerService } from './scaffold-synthesizer.service';
import { ExecutionService } from '../battles/execution.service';
import { GithubModule } from '../github/github.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisService } from '../../common/redis/redis.service';

@Module({
  imports: [forwardRef(() => GithubModule), PrismaModule],
  controllers: [AiController],
  providers: [
    TranspilerService,
    PrAnalyzerService,
    CodeReviewerService,
    ChangelogGeneratorService,
    PersonaBattleService,
    CodeHintService,
    VectorService,

    VerificationCoordinatorService,
    VerificationSwarmService,

    ComplexityAnalyzerService,
    MultiAgentReviewerService,
    DocEvaluatorService,
    VoiceCodeAssistantGateway,
    TestGeneratorService,
    PolyglotTranspilerService,
    SemanticConflictResolverService,
    GitService,
    ReproSynthesizerService,
    SyntheticBenchmarkService,
    BenchmarkGeneratorService,
    ScaffoldSynthesizerService,
    ExecutionService,
    RedisService,
  ],
  exports: [
    TranspilerService,
    PrAnalyzerService,
    CodeReviewerService,
    ChangelogGeneratorService,
    PersonaBattleService,
    CodeHintService,
    VectorService,

    VerificationCoordinatorService,
    VerificationSwarmService,

    ComplexityAnalyzerService,
    MultiAgentReviewerService,
    DocEvaluatorService,
    VoiceCodeAssistantGateway,
    TestGeneratorService,
    PolyglotTranspilerService,
    SemanticConflictResolverService,
    GitService,
    ReproSynthesizerService,
    SyntheticBenchmarkService,
    BenchmarkGeneratorService,
    ScaffoldSynthesizerService,
    ExecutionService,
  ],
})
export class AiModule {}
