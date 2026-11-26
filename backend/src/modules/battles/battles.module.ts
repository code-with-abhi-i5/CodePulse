import { Module } from '@nestjs/common';
import { BattlesController } from './battles.controller';
import { JitterBufferController } from './network/jitter-buffer.controller';
import { JitterBufferService } from './network/jitter-buffer.service';
import { BattlesService } from './battles.service';
import { DisputeAdjudicationService } from './dispute-adjudication.service';
import { BattlesGateway } from './battles.gateway';
import { SeasonResetService } from './season-reset.service';
import { BullModule } from '@nestjs/bullmq';
import { RatingDecayService } from './rating-decay.service';
import { RatingDecayWorker } from './rating-decay.worker';
import { RatingDecayScheduler } from './rating-decay.scheduler';
import { BattlesLifecycleScheduler } from './battles-lifecycle.scheduler';
import { BattlesLifecycleWorker } from './battles-lifecycle.worker';
import { MetricsModule } from '../metrics/metrics.module';
import { XpModule } from '../xp/xp.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ReplayStreamService } from './replay-stream.service';
import { ReplayEngineService } from './replay-engine.service';
import { CryptoModule } from '../crypto/crypto.module';
import { WatermarkService } from './watermark.service';
import { HypeMeterService } from './hype-meter.service';
import { HypeStormGateway } from './hype-storm.gateway';
import { RedisService } from '../../common/redis/redis.service';
import { RedlockService } from '../../common/redis/redlock.service';
import { TournamentEngineService } from './tournament-engine.service';
import { EsportsModule } from '../esports/esports.module';
import { AiModule } from '../ai/ai.module';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { RaidBossService } from './raid-boss.service';
import { AntiSmurfService } from './anti-smurf.service';
import { AntiCheatBiometricsService } from './anti-cheat-biometrics.service';
import { SabotageEngineService } from './sabotage-engine.service';
import { EdgeRelayService } from './edge-relay.service';
import { PlagiarismService } from './plagiarism.service';
import { RoomService } from './room.service';
import { EvaluatorService } from './evaluator.service';
import { RaftStateService } from './consensus/raft-state.service';
import { WalLogService } from './consensus/wal-log.service';
import { TeamMatchmakingService } from './team-matchmaking.service';

import { CrdtRelayGateway } from './crdt-relay.gateway';
import { ShardedMatchmakingQueueService } from './matchmaking/sharded-queue.service';
import { ConsistentHashRingService } from './matchmaking/consistent-hash-ring.service';
import { DistributedLeaderElectionService } from './consensus/leader-election.service';
import { DistributedDisruptorRelayService } from './distributed-disruptor-relay.service';
import { BattlesFirecrackerPoolService } from './firecracker-pool.service';
import { CodeSandboxService } from './code-sandbox.service';
import { ProtobufStreamService } from './protobuf-stream.service';
import { ProtoGatewayService } from './proto-gateway.service';
import { WebRtcSignalingGateway } from './webrtc-signaling.gateway';
import { FuzzingEvaluatorService } from './fuzzing-evaluator.service';
import { BattleDisputeService } from './dispute.service';
import { MutationTestingService } from './mutation-testing.service';

import { TrueSkill2Service } from './trueskill2.service';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'rating-decay' },
      { name: 'battles-lifecycle' },
      { name: 'tournament-engine' },
    ),
    MetricsModule,
    XpModule,
    AnalyticsModule,
    CryptoModule,
    EsportsModule,
    AiModule,
    TournamentsModule,
  ],
  controllers: [BattlesController, JitterBufferController],
  providers: [
    DisputeAdjudicationService,
    BattlesService,
    JitterBufferService,
    BattlesGateway,
    SeasonResetService,
    RatingDecayService,
    RatingDecayWorker,
    RatingDecayScheduler,
    BattlesLifecycleScheduler,
    BattlesLifecycleWorker,
    ReplayStreamService,
    ReplayEngineService,
    WatermarkService,
    HypeMeterService,
    HypeStormGateway,
    RedisService,
    TournamentEngineService,
    RaidBossService,
    AntiSmurfService,
    AntiCheatBiometricsService,
    SabotageEngineService,
    EdgeRelayService,
    PlagiarismService,
    RoomService,
    EvaluatorService,
    RaftStateService,
    WalLogService,
    CrdtRelayGateway,
    ShardedMatchmakingQueueService,
    ConsistentHashRingService,
    DistributedLeaderElectionService,
    DistributedDisruptorRelayService,
    BattlesFirecrackerPoolService,
    CodeSandboxService,
    ProtobufStreamService,
    ProtoGatewayService,
    WebRtcSignalingGateway,
    FuzzingEvaluatorService,
    BattleDisputeService,
    MutationTestingService,

    TeamMatchmakingService,

    TrueSkill2Service,
    RedlockService,
  ],
  exports: [
    DisputeAdjudicationService,
    BattlesService,
    JitterBufferService,
    BattlesGateway,
    ReplayStreamService,
    ReplayEngineService,
    WatermarkService,
    HypeMeterService,
    HypeStormGateway,
    RedisService,
    TournamentEngineService,
    SabotageEngineService,
    RaidBossService,
    AntiSmurfService,
    AntiCheatBiometricsService,
    EdgeRelayService,
    PlagiarismService,
    RoomService,
    EvaluatorService,
    RaftStateService,
    WalLogService,
    CrdtRelayGateway,
    ShardedMatchmakingQueueService,
    ConsistentHashRingService,
    DistributedLeaderElectionService,
    DistributedDisruptorRelayService,
    BattlesFirecrackerPoolService,
    CodeSandboxService,
    ProtobufStreamService,
    ProtoGatewayService,
    WebRtcSignalingGateway,
    FuzzingEvaluatorService,
    BattleDisputeService,
    MutationTestingService,

    TeamMatchmakingService,

    TrueSkill2Service,
    RedlockService,
  ],
})
export class BattlesModule {}
