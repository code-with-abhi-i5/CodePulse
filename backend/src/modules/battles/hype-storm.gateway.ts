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
import { Injectable, Logger, OnModuleDestroy, Optional } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../../common/redis/redis.service';
import { HypeMeterService } from './hype-meter.service';

export type SpectatorEmoji = '🔥' | '🚀' | '💡' | '🤯' | '💀';

export const VALID_EMOJIS: Set<SpectatorEmoji> = new Set(['🔥', '🚀', '💡', '🤯', '💀']);

export interface SpectatorReactionItem {
  emoji: SpectatorEmoji;
  userId: string;
  timestamp: number;
}

export interface HypeStormBroadcast {
  battleId: string;
  timestamp: number;
  hypePercentage: number; // 0 to 100
  reactionRate: number; // estimated reactions per second
  totalWindowReactions: number; // reactions in current 100ms slice
  uniqueSpectators: number; // unique reacting spectators from HyperLogLog
  densityVectors: Record<SpectatorEmoji, number>;
  dominantEmoji: SpectatorEmoji;
  isPeakHype: boolean; // true if hypePercentage >= 95
  triggerBurst: boolean; // true on rising edge hitting 100%
  audioHype: {
    pitchMultiplier: number; // 1.0 to 2.5
    intensity: number; // 0.0 to 1.0
    crowdVolume: number; // 0.0 to 1.0
    soundCue: 'NONE' | 'HYPE_BUILDUP' | 'HYPE_BURST_PEAK';
  };
}

interface RoomHypeInternalState {
  currentHype: number;
  peakHype: number;
  hasTriggeredBurstForCurrentPeak: boolean;
  uniqueUsersFallback: Set<string>;
}

@Injectable()
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/hype-storm',
})
export class HypeStormGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, OnModuleDestroy
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(HypeStormGateway.name);

  // In-memory micro-batch queues per battle room for sub-millisecond, lock-free reaction ingestion
  private readonly reactionQueues = new Map<string, SpectatorReactionItem[]>();

  // Live state tracking per battle room
  private readonly roomStates = new Map<string, RoomHypeInternalState>();

  // Per-spectator token bucket rate limiter (prevent socket flooding beyond 30 reactions/sec)
  private readonly spectatorRateLimits = new Map<string, { tokens: number; lastRefill: number }>();

  // Aggregation ticker running at exactly 10 updates per second (100ms interval)
  private tickInterval: NodeJS.Timeout | null = null;
  private readonly TICK_MS = 100;

  // Optional subscriber callback for testing and telemetry
  private onTickCallback?: (broadcast: HypeStormBroadcast) => void;

  constructor(
    @Optional() private readonly redisService?: RedisService,
    @Optional() private readonly hypeMeterService?: HypeMeterService,
  ) {}

  afterInit() {
    this.startAggregationLoop();
    this.logger.log('HypeStormGateway initialized with 100ms Redis HLL & Sorted Set throttling');
  }

  onModuleDestroy() {
    this.stopAggregationLoop();
  }

  public startAggregationLoop(): void {
    if (this.tickInterval) return;
    this.tickInterval = setInterval(() => {
      this.processAggregationTick();
    }, this.TICK_MS);
  }

  public stopAggregationLoop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  public setOnTickCallback(callback: (broadcast: HypeStormBroadcast) => void): void {
    this.onTickCallback = callback;
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Spectator connected to HypeStorm: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.spectatorRateLimits.delete(client.id);
    this.logger.debug(`Spectator disconnected from HypeStorm: ${client.id}`);
  }

  /**
   * Spectator joins a battle hype room
   */
  @SubscribeMessage('spectator:join')
  handleSpectatorJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { battleId: string; userId?: string },
  ) {
    if (!data?.battleId) return { error: 'battleId required' };
    client.join(`battle:${data.battleId}`);
    client.join(`spectator:${data.battleId}`);

    const state = this.getOrCreateRoomState(data.battleId);
    return {
      joined: true,
      battleId: data.battleId,
      currentHype: Math.round(state.currentHype),
    };
  }

  /**
   * Spectator leaves a battle hype room
   */
  @SubscribeMessage('spectator:leave')
  handleSpectatorLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { battleId: string },
  ) {
    if (data?.battleId) {
      client.leave(`battle:${data.battleId}`);
      client.leave(`spectator:${data.battleId}`);
    }
    return { left: true };
  }

  /**
   * High-throughput reaction ingestion endpoint.
   * Handles 10,000+ reactions/sec by buffering without per-event broadcast fan-out.
   */
  @SubscribeMessage('spectator:react')
  handleSpectatorReact(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { battleId: string; emoji: SpectatorEmoji; userId?: string },
  ) {
    const userId = data.userId || client.id;
    const accepted = this.recordReaction({
      battleId: data.battleId,
      emoji: data.emoji,
      userId,
    });

    return accepted ? { status: 'buffered' } : { status: 'rate_limited' };
  }

  @SubscribeMessage('reaction:send')
  handleReactionSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { battleId: string; emoji: SpectatorEmoji; userId?: string },
  ) {
    return this.handleSpectatorReact(client, data);
  }

  /**
   * Directly records an emoji reaction into the room's high-speed buffer.
   * Protected by per-spectator token bucket rate limiting (30 reactions/sec max burst).
   */
  public recordReaction(params: {
    battleId: string;
    emoji: SpectatorEmoji;
    userId?: string;
    timestamp?: number;
  }): boolean {
    const { battleId, emoji } = params;
    if (!battleId || !VALID_EMOJIS.has(emoji)) {
      return false;
    }

    const userId = params.userId || 'anon';
    const now = params.timestamp || Date.now();

    // Check rate limiter: capacity = 30 tokens, refill = 15 tokens/sec
    if (!this.checkRateLimit(userId, now)) {
      return false;
    }

    let queue = this.reactionQueues.get(battleId);
    if (!queue) {
      queue = [];
      this.reactionQueues.set(battleId, queue);
    }

    queue.push({
      emoji,
      userId,
      timestamp: now,
    });

    const state = this.getOrCreateRoomState(battleId);
    state.uniqueUsersFallback.add(userId);

    // Also forward to existing HypeMeterService if available
    if (this.hypeMeterService) {
      this.hypeMeterService.recordReaction({
        battleId,
        userId,
        emoji: emoji as any,
        timestamp: now,
      });
    }

    return true;
  }

  /**
   * Core 100ms aggregation loop:
   * 1. Drains queues for active rooms.
   * 2. Aggregates density vectors across (🔥, 🚀, 💡, 🤯, 💀).
   * 3. Syncs to Redis with HyperLogLog (unique audience) and Sorted Sets.
   * 4. Calculates dynamic Hype Index (0-100%) and rising-edge 100% burst trigger.
   * 5. Emits single throttled broadcast per active battle room.
   */
  public processAggregationTick(): HypeStormBroadcast[] {
    const now = Date.now();
    const broadcasts: HypeStormBroadcast[] = [];

    // Collect all active battleIds
    const activeBattleIds = new Set<string>([
      ...this.reactionQueues.keys(),
      ...this.roomStates.keys(),
    ]);

    for (const battleId of activeBattleIds) {
      const queue = this.reactionQueues.get(battleId) || [];
      // $O(1)$ queue drain
      this.reactionQueues.set(battleId, []);

      const state = this.getOrCreateRoomState(battleId);
      const densityVectors: Record<SpectatorEmoji, number> = {
        '🔥': 0,
        '🚀': 0,
        '💡': 0,
        '🤯': 0,
        '💀': 0,
      };

      for (const rx of queue) {
        if (densityVectors[rx.emoji] !== undefined) {
          densityVectors[rx.emoji]++;
        }
      }

      const totalWindowReactions = queue.length;
      const reactionRate = totalWindowReactions * (1000 / this.TICK_MS); // reactions/sec

      // Async write to Redis HyperLogLog and Sorted Sets without blocking event loop
      if (this.redisService && queue.length > 0) {
        this.redisService
          .batchAddHypeReactions(battleId, queue)
          .catch((err) => this.logger.debug(`Redis batch add failed: ${err.message}`));
      }

      // Compute weighted intensity score
      // 🔥: 1.3, 🚀: 1.2, 💡: 1.1, 🤯: 1.4, 💀: 1.0
      const weightedScore =
        densityVectors['🔥'] * 1.3 +
        densityVectors['🚀'] * 1.2 +
        densityVectors['💡'] * 1.1 +
        densityVectors['🤯'] * 1.4 +
        densityVectors['💀'] * 1.0;

      // Dynamic Hype calculation:
      // Reactions increase hype; inactivity smoothly decays hype down towards 0.
      if (totalWindowReactions > 0) {
        // Gain formula: scaling such that ~35-50 reactions in 100ms drives Hype Meter to 100%
        const hypeGain = Math.min(100, Math.pow(weightedScore, 0.85) * 3.5);
        state.currentHype = Math.min(100, state.currentHype + hypeGain);
      } else {
        // Smooth decay of 3.5% per 100ms when idle
        state.currentHype = Math.max(0, state.currentHype - 3.5);
      }

      const roundedHype = Math.round(state.currentHype);
      if (roundedHype > state.peakHype) {
        state.peakHype = roundedHype;
      }

      // Trigger burst on rising edge reaching 100%
      let triggerBurst = false;
      if (roundedHype >= 100) {
        if (!state.hasTriggeredBurstForCurrentPeak) {
          triggerBurst = true;
          state.hasTriggeredBurstForCurrentPeak = true;
        }
      } else if (roundedHype < 85) {
        // Reset burst trigger flag once hype cools below 85%
        state.hasTriggeredBurstForCurrentPeak = false;
      }

      const isPeakHype = roundedHype >= 95;

      // Find dominant emoji in this slice
      let dominantEmoji: SpectatorEmoji = '🔥';
      let maxEmojiCount = -1;
      for (const [em, cnt] of Object.entries(densityVectors) as [SpectatorEmoji, number][]) {
        if (cnt > maxEmojiCount) {
          maxEmojiCount = cnt;
          dominantEmoji = em;
        }
      }

      // Audio Hype parameters for live Web Audio synthesis
      const pitchMultiplier = Number((1.0 + (state.currentHype / 100) * 1.5).toFixed(2));
      const intensity = Number((state.currentHype / 100).toFixed(2));
      const crowdVolume = Number((0.2 + (state.currentHype / 100) * 0.8).toFixed(2));
      const soundCue = triggerBurst
        ? 'HYPE_BURST_PEAK'
        : roundedHype >= 80
        ? 'HYPE_BUILDUP'
        : 'NONE';

      const broadcast: HypeStormBroadcast = {
        battleId,
        timestamp: now,
        hypePercentage: roundedHype,
        reactionRate,
        totalWindowReactions,
        uniqueSpectators: state.uniqueUsersFallback.size,
        densityVectors,
        dominantEmoji,
        isPeakHype,
        triggerBurst,
        audioHype: {
          pitchMultiplier,
          intensity,
          crowdVolume,
          soundCue,
        },
      };

      broadcasts.push(broadcast);

      // Throttled WebSocket broadcast to clients
      if (this.server) {
        this.server.to(`battle:${battleId}`).emit('hype:storm_update', broadcast);
        this.server.to(`spectator:${battleId}`).emit('hype:storm_update', broadcast);
      }

      if (this.onTickCallback) {
        this.onTickCallback(broadcast);
      }

      // Cleanup idle battle state after prolonged inactivity
      if (roundedHype === 0 && queue.length === 0 && state.uniqueUsersFallback.size === 0) {
        this.roomStates.delete(battleId);
        this.reactionQueues.delete(battleId);
      }
    }

    return broadcasts;
  }

  /**
   * Retrieves current hype snapshot for a battle
   */
  public getHypeSnapshot(battleId: string): HypeStormBroadcast | null {
    const state = this.roomStates.get(battleId);
    if (!state) return null;

    const roundedHype = Math.round(state.currentHype);
    return {
      battleId,
      timestamp: Date.now(),
      hypePercentage: roundedHype,
      reactionRate: 0,
      totalWindowReactions: 0,
      uniqueSpectators: state.uniqueUsersFallback.size,
      densityVectors: { '🔥': 0, '🚀': 0, '💡': 0, '🤯': 0, '💀': 0 },
      dominantEmoji: '🔥',
      isPeakHype: roundedHype >= 95,
      triggerBurst: false,
      audioHype: {
        pitchMultiplier: Number((1.0 + (roundedHype / 100) * 1.5).toFixed(2)),
        intensity: Number((roundedHype / 100).toFixed(2)),
        crowdVolume: Number((0.2 + (roundedHype / 100) * 0.8).toFixed(2)),
        soundCue: 'NONE',
      },
    };
  }

  /**
   * For testing or game master events: sets exact hype percentage
   */
  public setHypeLevel(battleId: string, level: number): void {
    const state = this.getOrCreateRoomState(battleId);
    state.currentHype = Math.max(0, Math.min(100, level));
  }

  /**
   * Resets battle hype state
   */
  public resetBattleHype(battleId: string): void {
    this.reactionQueues.delete(battleId);
    this.roomStates.delete(battleId);
  }

  private checkRateLimit(userId: string, now: number): boolean {
    const CAPACITY = 30;
    const REFILL_RATE = 15; // tokens/second

    let bucket = this.spectatorRateLimits.get(userId);
    if (!bucket) {
      bucket = { tokens: CAPACITY - 1, lastRefill: now };
      this.spectatorRateLimits.set(userId, bucket);
      return true;
    }

    const elapsedSec = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(CAPACITY, bucket.tokens + elapsedSec * REFILL_RATE);
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }

  private getOrCreateRoomState(battleId: string): RoomHypeInternalState {
    let state = this.roomStates.get(battleId);
    if (!state) {
      state = {
        currentHype: 0,
        peakHype: 0,
        hasTriggeredBurstForCurrentPeak: false,
        uniqueUsersFallback: new Set<string>(),
      };
      this.roomStates.set(battleId, state);
    }
    return state;
  }
}
