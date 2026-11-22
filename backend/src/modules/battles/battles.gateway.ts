import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger, OnModuleDestroy, Optional } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MetricsService } from '../metrics/metrics.service';
import { ZkpVerifierService } from '../crypto/zkp-verifier.service';
import type { ZkpVerificationRequest } from '../crypto/zkp-verifier.service';
import { DisruptorRingBuffer } from '../../common/concurrency/disruptor-ring-buffer';
import { WatermarkService } from './watermark.service';
import { HypeMeterService, EmojiType } from './hype-meter.service';
import { AiShoutcasterService } from '../esports/ai-shoutcaster.service';
import type { CommentaryStyle, ShoutcasterMatchEvent } from '../esports/ai-shoutcaster.service';
import { RaidBossService } from './raid-boss.service';
import type { RaidBossArchetype, RaidPatchSubmission } from './raid-boss.service';
import { PredictionMarketService } from '../esports/prediction-market.service';
import { SabotageEngineService, SABOTAGE_POWERUPS } from './sabotage-engine.service';
import type { SabotageType, DefenseType } from './sabotage-engine.service';

interface PlayerState {
  userId: string;
  username: string;
  isReady: boolean;
  socketId: string;
}

interface RoomState {
  battleId: string;
  players: Record<string, PlayerState>;
  currentRound: number;
  totalRounds: number;
  countdownTimer?: NodeJS.Timeout;
}

export interface BattleIngestEvent {
  battleId: string;
  userId: string;
  socketId: string;
  eventType: 'keystroke' | 'test_case_eval' | 'disconnect' | 'player_ready' | 'player_join' | 'heartbeat';
  data: any;
  timestamp: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/battles',
})
export class BattlesGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, OnModuleDestroy
{
  // Pre-allocated LMAX Disruptor Ring Buffer for ultra-high-throughput lock-free event ingestion
  public readonly ringBuffer = new DisruptorRingBuffer<BattleIngestEvent>(65536);
  private drainInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly metrics: MetricsService,
    @Optional() private readonly zkpService?: ZkpVerifierService,
    @Optional() private readonly watermarkService?: WatermarkService,
    @Optional() private readonly hypeMeterService?: HypeMeterService,
    @Optional() private readonly shoutcasterService?: AiShoutcasterService,
    @Optional() private readonly raidBossService?: RaidBossService,
    @Optional() private readonly predictionMarket?: PredictionMarketService,
    @Optional() private readonly sabotageEngine?: SabotageEngineService,
  ) {}

  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(BattlesGateway.name);
  private rooms: Map<string, RoomState> = new Map();
  private disconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  afterInit() {
    this.startDisruptorConsumerLoop();
    if (this.hypeMeterService) {
      this.hypeMeterService.onTick((snapshot) => {
        // Broadcast single aggregated 100ms hype tick to all spectators
        this.server.to(`spectator:${snapshot.battleId}`).emit('hype:tick', snapshot);
      });
    }
    this.logger.log('BattlesGateway initialized with LMAX Disruptor lock-free ring buffer');
  }

  onModuleDestroy() {
    if (this.drainInterval) {
      clearInterval(this.drainInterval);
      this.drainInterval = null;
    }
  }

  /**
   * Continuous high-frequency consumer draining the Disruptor Ring Buffer
   * with zero GC pauses and deterministic ordering.
   */
  private startDisruptorConsumerLoop() {
    this.drainInterval = setInterval(() => {
      this.ringBuffer.drain((event) => {
        this.processRingBufferEvent(event.payload);
      }, 1024);
    }, 5); // 5ms micro-batching drain
  }

  /**
   * Internal processor for events drained from the lock-free ring buffer.
   */
  private processRingBufferEvent(event: BattleIngestEvent) {
    if (!event) return;
    const { eventType, battleId, userId, data } = event;

    if (eventType === 'keystroke') {
      this.server
        ?.to(`battle:${battleId}`)
        ?.emit('opponent_keystroke_stream', {
          battleId,
          userId,
          deltaLength: data?.delta?.length || 0,
          cursorPosition: data?.cursorPosition,
          timestamp: event.timestamp,
        });
      if (this.shoutcasterService) {
        const burst = this.shoutcasterService.recordKeystrokeAndDetectBurst(battleId, event.timestamp);
        if (burst.isBurst) {
          void this.broadcastShoutcasterEvent({
            battleId,
            eventType: 'fast_typing_burst',
            actorUsername: this.rooms.get(battleId)?.players[userId]?.username ?? userId,
            wpm: burst.estimatedWpm,
            timestampMs: event.timestamp,
          });
        }
      }
    } else if (eventType === 'test_case_eval') {
      const lockedPool = this.predictionMarket?.lockPoolOnCodeExecution(battleId);
      if (lockedPool && lockedPool.status === 'LOCKED') {
        this.server?.to(`spectator:${battleId}`)?.emit('prediction_pool_locked', {
          battleId,
          poolId: lockedPool.poolId,
          reason: lockedPool.lockReason,
        });
      }
      this.server
        ?.to(`battle:${battleId}`)
        ?.emit('player_test_case_progress', {
          battleId,
          userId,
          passedCount: data?.passedCount,
          totalCount: data?.totalCount,
          executionTimeMs: data?.executionTimeMs,
        });
      if (this.shoutcasterService && typeof data?.passedCount === 'number' && typeof data?.totalCount === 'number') {
        const actorName = this.rooms.get(battleId)?.players[userId]?.username ?? userId;
        const isAllPassed = data.passedCount === data.totalCount && data.totalCount > 0;
        void this.broadcastShoutcasterEvent({
          battleId,
          eventType: isAllPassed ? 'optimization_breakthrough' : 'failing_test_cases',
          actorUsername: actorName,
          passedTests: data.passedCount,
          totalTests: data.totalCount,
          complexityAfter: isAllPassed ? 'O(N)' : undefined,
          timestampMs: event.timestamp,
        });
      }
    } else if (eventType === 'disconnect') {
      this.handlePlayerDisconnectProcessing(event.socketId, userId, battleId);
    }
  }

  handleConnection(client: Socket) {
    this.metrics.socketConnected(client.id);
    this.logger.log(`Client connected to battle socket: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.metrics.socketDisconnected(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);

    // Identify which room client was in and route through Disruptor Ring Buffer
    for (const [battleId, room] of this.rooms.entries()) {
      for (const [userId, player] of Object.entries(room.players)) {
        if (player.socketId === client.id) {
          this.ringBuffer.publish('disconnect', {
            battleId,
            userId,
            socketId: client.id,
            eventType: 'disconnect',
            data: { username: player.username },
            timestamp: Date.now(),
          });
          return;
        }
      }
    }
  }

  private handlePlayerDisconnectProcessing(socketId: string, userId: string, battleId: string) {
    const room = this.rooms.get(battleId);
    if (!room) return;
    const player = room.players[userId];
    if (!player) return;

    this.logger.warn(
      `Player ${player.username} (${userId}) disconnected from battle ${battleId}`,
    );

    // Broadcast temporary disconnect notice
    this.server
      ?.to(`battle:${battleId}`)
      ?.emit('player_disconnect_warning', {
        userId,
        username: player.username,
        reconnectWindowSeconds: 30,
      });

    // 30-second grace period before forfeiture
    const timeout = setTimeout(() => {
      delete room.players[userId];
      this.server?.to(`battle:${battleId}`)?.emit('player_forfeit', {
        userId,
        username: player.username,
        message: 'Player failed to reconnect within 30 seconds.',
      });
      this.disconnectTimers.delete(socketId);
    }, 30000);

    this.disconnectTimers.set(socketId, timeout);
  }

  /**
   * Route incoming live keystrokes through the Lock-Free Disruptor Ring Buffer.
   */
  @SubscribeMessage('keystroke')
  handleKeystroke(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      battleId: string;
      userId: string;
      delta: string;
      cursorPosition?: number;
    },
  ) {
    this.ringBuffer.publish('keystroke', {
      battleId: data.battleId,
      userId: data.userId,
      socketId: client.id,
      eventType: 'keystroke',
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Route test case evaluation events through the Disruptor Ring Buffer.
   */
  @SubscribeMessage('test_case_eval')
  handleTestCaseEval(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      battleId: string;
      userId: string;
      passedCount: number;
      totalCount: number;
      executionTimeMs?: number;
    },
  ) {
    this.ringBuffer.publish('test_case_eval', {
      battleId: data.battleId,
      userId: data.userId,
      socketId: client.id,
      eventType: 'test_case_eval',
      data,
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('player_join')
  handlePlayerJoin(
    @MessageBody() data: { battleId: string; userId: string; username: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { battleId, userId, username } = data;
    const roomName = `battle:${battleId}`;

    void client.join(roomName);

    if (!this.rooms.has(battleId)) {
      this.rooms.set(battleId, {
        battleId,
        players: {},
        currentRound: 0,
        totalRounds: 5,
      });
    }

    const room = this.rooms.get(battleId)!;

    // Clear any pending disconnect timer if player reconnected
    for (const [socketId, timer] of this.disconnectTimers.entries()) {
      clearTimeout(timer);
      this.disconnectTimers.delete(socketId);
    }

    room.players[userId] = {
      userId,
      username,
      isReady: false,
      socketId: client.id,
    };

    this.logger.log(`User ${username} joined battle room: ${roomName}`);

    // Broadcast updated lobby state
    this.server.to(roomName).emit('lobby_state_update', {
      battleId,
      players: Object.values(room.players),
    });
  }

  @SubscribeMessage('player_ready')
  handlePlayerReady(@MessageBody() data: { battleId: string; userId: string }) {
    const { battleId, userId } = data;
    const room = this.rooms.get(battleId);
    if (!room || !room.players[userId]) return;

    room.players[userId].isReady = true;
    const roomName = `battle:${battleId}`;

    this.server.to(roomName).emit('player_ready_confirmed', {
      userId,
      players: Object.values(room.players),
    });

    // Check if both players are ready
    const playersList = Object.values(room.players);
    if (playersList.length >= 2 && playersList.every((p) => p.isReady)) {
      this.startCountdown(battleId);
    }
  }

  private startCountdown(battleId: string) {
    const roomName = `battle:${battleId}`;
    let secondsLeft = 3;

    this.server.to(roomName).emit('start_countdown', { count: secondsLeft });

    const interval = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft > 0) {
        this.server
          .to(roomName)
          .emit('start_countdown', { count: secondsLeft });
      } else {
        clearInterval(interval);
        this.server.to(roomName).emit('battle_commenced', {
          round: 1,
          metric: 'Commits',
        });
      }
    }, 1000);
  }

  @SubscribeMessage('round_transition')
  handleRoundTransition(
    @MessageBody()
    data: {
      battleId: string;
      nextRound: number;
      metric: string;
    },
  ) {
    const { battleId, nextRound, metric } = data;
    const room = this.rooms.get(battleId);
    if (room) {
      room.currentRound = nextRound;
      this.server.to(`battle:${battleId}`).emit('round_transition_sync', {
        round: nextRound,
        metric,
      });
    }
  }

  @SubscribeMessage('submit_zkp_solution')
  async handleSubmitZkpSolution(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ZkpVerificationRequest,
  ) {
    if (!this.zkpService) {
      client.emit('zkp_verification_result', {
        valid: false,
        error: 'ZkpVerifierService not configured on gateway',
      });
      return;
    }

    try {
      const result = await this.zkpService.verifyZkpProof(data);
      client.emit('zkp_verification_result', result);

      if (result.valid) {
        this.server.to(`battle:${data.battleId}`).emit('player_solved_private_round', {
          battleId: data.battleId,
          userId: data.userId,
          proofHash: result.proofHash,
          verificationDurationMs: result.verificationDurationMs,
        });
      }
    } catch (err: any) {
      client.emit('zkp_verification_result', {
        valid: false,
        error: err.message,
      });
    }
  }

  @SubscribeMessage('tab_focus_change')
  handleTabFocusChange(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      battleId: string;
      userId: string;
      event: 'blur' | 'focus' | 'visibility_hidden' | 'visibility_visible';
    },
  ) {
    if (this.watermarkService) {
      const recorded = this.watermarkService.recordTabFocusChange(
        data.battleId,
        data.userId,
        data.event,
        Date.now(),
      );

      // Alert battle channel if focus lost
      if (data.event === 'blur' || data.event === 'visibility_hidden') {
        this.server.to(`battle:${data.battleId}`).emit('anti_ghosting_warning', {
          userId: data.userId,
          message: 'Player switched away from active battle screen',
          timestamp: recorded.timestamp,
        });
      }
    }
  }

  @SubscribeMessage('request_spectator_stream')
  handleSpectatorStreamRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      battleId: string;
      spectatorId: string;
    },
  ) {
    const ipAddress =
      client.handshake.headers['x-forwarded-for']?.toString() ||
      client.handshake.address ||
      '127.0.0.1';

    if (this.watermarkService) {
      const watermark = this.watermarkService.generateSteganographicWatermark({
        spectatorId: data.spectatorId,
        ipAddress,
        timestamp: Date.now(),
        matchId: data.battleId,
      });

      client.emit('spectator_stream_initialized', {
        battleId: data.battleId,
        delaySeconds: this.watermarkService.getSpectatorDelay(),
        watermark: {
          signature: watermark.signature,
          luminanceModulationMap: watermark.luminanceModulationMap,
          timestamp: watermark.timestamp,
        },
      });
    }

    void client.join(`spectator:${data.battleId}`);
  }

  /**
   * Spectator emoji reaction handler
   * Buffers reactions without individual fan-out broadcasts to conserve bandwidth
   */
  @SubscribeMessage('spectator:react')
  handleSpectatorReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      battleId: string;
      userId: string;
      emoji: EmojiType;
    },
  ) {
    if (this.hypeMeterService) {
      this.hypeMeterService.recordReaction({
        battleId: data.battleId,
        userId: data.userId || client.id,
        emoji: data.emoji,
        timestamp: Date.now(),
      });
    }

    return { status: 'buffered' };
  }

  async broadcastShoutcasterEvent(event: ShoutcasterMatchEvent) {
    if (!this.shoutcasterService) return null;
    const outcome = await this.shoutcasterService.processMatchEvent(event);
    if (!outcome.throttled) {
      for (const chunk of outcome.chunks) {
        this.server
          ?.to(`battle:${event.battleId}`)
          ?.to(`spectator:${event.battleId}`)
          ?.emit('shoutcaster_commentary_chunk', chunk);
      }
    }
    return outcome;
  }

  @SubscribeMessage('set_commentary_style')
  handleSetCommentaryStyle(
    @MessageBody() data: { battleId: string; style: CommentaryStyle },
  ) {
    if (!this.shoutcasterService) return { style: data.style };
    const updated = this.shoutcasterService.setBattleStyle(data.battleId, data.style);
    this.server
      ?.to(`battle:${data.battleId}`)
      ?.to(`spectator:${data.battleId}`)
      ?.emit('shoutcaster_style_updated', { battleId: data.battleId, style: updated });
    return { battleId: data.battleId, style: updated };
  }

  @SubscribeMessage('trigger_shoutcaster_event')
  async handleTriggerShoutcasterEvent(
    @MessageBody() event: ShoutcasterMatchEvent,
  ) {
    return this.broadcastShoutcasterEvent(event);
  }

  @SubscribeMessage('join_raid')
  handleJoinRaid(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      raidId: string;
      userId: string;
      username: string;
      archetype?: RaidBossArchetype;
    },
  ) {
    const roomName = `raid:${data.raidId}`;
    void client.join(roomName);
    if (!this.raidBossService) return null;

    this.raidBossService.getOrCreateEncounter(data.raidId, data.archetype);
    const encounter = this.raidBossService.joinRaid(data.raidId, {
      userId: data.userId,
      username: data.username,
    });
    this.server?.to(roomName)?.emit('raid_state_sync', encounter);
    return encounter;
  }

  @SubscribeMessage('submit_raid_patch')
  handleSubmitRaidPatch(
    @MessageBody() submission: RaidPatchSubmission,
  ) {
    if (!this.raidBossService) return null;
    const outcome = this.raidBossService.applyCodePatchStrike(submission);
    const roomName = `raid:${submission.raidId}`;

    this.server?.to(roomName)?.emit('raid_state_sync', outcome.encounter);
    if (outcome.phaseTransitioned) {
      this.server?.to(roomName)?.emit('raid_phase_transition', {
        raidId: submission.raidId,
        newPhase: outcome.newPhase,
        combatLog: outcome.combatLog,
      });
    }
    if (outcome.encounter.status === 'VICTORY') {
      this.server?.to(roomName)?.emit('raid_victory', {
        raidId: submission.raidId,
        rewards: outcome.encounter.rewards,
      });
    }
    return outcome;
  }

  @SubscribeMessage('raid_tick')
  handleRaidTick(
    @MessageBody() data: { raidId: string; elapsedSeconds?: number },
  ) {
    if (!this.raidBossService) return null;
    const encounter = this.raidBossService.tickRaidTimer(
      data.raidId,
      data.elapsedSeconds ?? 1,
    );
    const roomName = `raid:${data.raidId}`;
    this.server?.to(roomName)?.emit('raid_state_sync', encounter);
    if (encounter.status === 'WIPED') {
      this.server?.to(roomName)?.emit('raid_wipe', {
        raidId: data.raidId,
        bossName: encounter.bossName,
      });
    }
    return encounter;
  }

  @SubscribeMessage('place_prediction')
  async handlePlacePrediction(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      battleId: string;
      userId: string;
      outcomeKey: string;
      stakeBits: number;
    },
  ) {
    if (!this.predictionMarket) return null;
    const outcome = await this.predictionMarket.placePrediction(data);
    this.server
      ?.to(`spectator:${data.battleId}`)
      ?.to(`battle:${data.battleId}`)
      ?.emit('prediction_odds_updated', {
        battleId: data.battleId,
        poolId: outcome.pool.poolId,
        odds: outcome.pool.odds,
        outcomePools: outcome.pool.outcomePools,
        totalPoolBits: outcome.pool.totalPoolBits,
      });
    client.emit('prediction_placed', outcome);
    return outcome;
  }

  @SubscribeMessage('heartbeat_ping')
  handleHeartbeatPing(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { battleId: string; timestamp: number },
  ) {
    client.emit('heartbeat_ack', {
      battleId: data.battleId,
      originalTimestamp: data.timestamp,
      serverTimestamp: Date.now(),
    });
  }

  @SubscribeMessage('sabotage:deploy')
  handleSabotageDeploy(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      battleId: string;
      attackerId: string;
      attackerUsername: string;
      targetId: string;
      targetUsername: string;
      powerupType: SabotageType;
      currentCode: string;
    },
  ) {
    if (!this.sabotageEngine) return null;
    const result = this.sabotageEngine.deploySabotage(data);

    // Broadcast humorous event banner to entire battle room
    this.server?.to(`battle:${data.battleId}`)?.emit('sabotage:announcement', {
      battleId: data.battleId,
      bannerMessage: result.bannerMessage,
      deflected: result.deflected,
      attackerId: data.attackerId,
      targetId: data.targetId,
      powerupType: data.powerupType,
      timestamp: Date.now(),
    });

    // If not deflected, send the mutated code payload to the target player
    if (!result.deflected && result.effect) {
      this.server?.to(`battle:${data.battleId}`)?.emit('sabotage:effect', {
        battleId: data.battleId,
        targetId: data.targetId,
        sabotageId: result.effect.id,
        powerupType: data.powerupType,
        mutatedCode: result.mutatedCode,
        durationMs: SABOTAGE_POWERUPS[data.powerupType]?.durationMs || 30000,
        expiresAt: result.effect.expiresAt,
      });
    }

    client.emit('sabotage:deployed', {
      success: true,
      remainingPoints: result.remainingPoints,
      deflected: result.deflected,
    });

    return result;
  }

  @SubscribeMessage('sabotage:counter')
  handleSabotageCounter(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      battleId: string;
      userId: string;
      username: string;
      defenseType: DefenseType;
      currentCode: string;
    },
  ) {
    if (!this.sabotageEngine) return null;
    const result = this.sabotageEngine.activateDefense(data);

    this.server?.to(`battle:${data.battleId}`)?.emit('sabotage:announcement', {
      battleId: data.battleId,
      bannerMessage: result.bannerMessage,
      userId: data.userId,
      defenseType: data.defenseType,
      timestamp: Date.now(),
    });

    if (data.defenseType === 'CODE_FORMAT_PURGE') {
      this.server?.to(`battle:${data.battleId}`)?.emit('sabotage:purged', {
        battleId: data.battleId,
        userId: data.userId,
        restoredCode: result.restoredCode,
        purgedCount: result.purgedCount,
      });
    }

    client.emit('sabotage:counter_activated', {
      success: true,
      defenseType: data.defenseType,
      remainingPoints: result.remainingPoints,
    });

    return result;
  }

  @SubscribeMessage('sabotage:get_inventory')
  handleSabotageGetInventory(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { battleId: string; userId: string; username?: string },
  ) {
    if (!this.sabotageEngine) return null;
    const state = this.sabotageEngine.getOrCreatePlayerState(
      data.battleId,
      data.userId,
      data.username,
    );

    const payload = {
      powerupPoints: state.powerupPoints,
      hasShield: state.hasShield,
      activeSabotages: state.activeSabotages,
      powerupCatalog: SABOTAGE_POWERUPS,
    };

    client.emit('sabotage:inventory_state', payload);
    return payload;
  }
}
