import { Injectable, Logger, Optional } from '@nestjs/common';
import { CachePreloaderService } from './cache-preloader.service';

export interface DomainMutationEvent<T = any> {
  eventId: string;
  eventType: 'TOURNAMENT_CREATED' | 'TOURNAMENT_PUBLISHED' | 'CHALLENGE_CREATED' | 'CHALLENGE_UPDATED' | 'CONTEST_OPENED';
  aggregateId: string;
  data: T;
  timestamp: number;
}

export interface SubscriberTelemetry {
  totalEventsProcessed: number;
  totalEntitiesWarmed: number;
  totalWarmupCyclesMs: number;
  averageWarmupLatencyMs: number;
}

@Injectable()
export class CacheWarmingSubscriberService {
  private readonly logger = new Logger(CacheWarmingSubscriberService.name);

  private totalEvents = 0;
  private totalWarmed = 0;
  private totalDurationSum = 0;

  constructor(
    @Optional() private readonly preloader?: CachePreloaderService
  ) {
    if (!this.preloader) {
      this.preloader = new CachePreloaderService();
    }
  }

  /**
   * Reactive event handler processing domain mutation events and pre-populating caches.
   */
  public async handleDomainMutationEvent(event: DomainMutationEvent): Promise<string[]> {
    const startTime = Date.now();
    const warmedKeys: string[] = [];

    this.totalEvents++;
    this.logger.log(`Received domain event ${event.eventType} for aggregate ${event.aggregateId}. Initiating proactive cache warm-up.`);

    switch (event.eventType) {
      case 'TOURNAMENT_CREATED':
      case 'TOURNAMENT_PUBLISHED': {
        const tournamentKey = `cache:tournament:${event.aggregateId}:graph`;
        const rosterKey = `cache:tournament:${event.aggregateId}:challenges`;

        // Pre-warm full tournament details and challenge roster
        await this.preloader.preloadEntity(tournamentKey, {
          id: event.aggregateId,
          ...event.data,
          warmedAt: Date.now(),
          status: 'WARMED',
        });
        warmedKeys.push(tournamentKey);

        await this.preloader.preloadEntity(rosterKey, {
          tournamentId: event.aggregateId,
          challenges: event.data.challenges || [],
          participantCapacity: event.data.capacity || 5000,
        });
        warmedKeys.push(rosterKey);
        break;
      }

      case 'CHALLENGE_CREATED':
      case 'CHALLENGE_UPDATED': {
        const challengeKey = `cache:challenge:${event.aggregateId}:detail`;
        const starterCodeKey = `cache:challenge:${event.aggregateId}:starter_code`;

        await this.preloader.preloadEntity(challengeKey, {
          id: event.aggregateId,
          ...event.data,
          warmedAt: Date.now(),
        });
        warmedKeys.push(challengeKey);

        if (event.data.starterTemplates) {
          await this.preloader.preloadEntity(starterCodeKey, event.data.starterTemplates);
          warmedKeys.push(starterCodeKey);
        }
        break;
      }

      case 'CONTEST_OPENED': {
        const contestKey = `cache:contest:${event.aggregateId}:active_state`;
        const leaderboardKey = `cache:contest:${event.aggregateId}:initial_leaderboard`;

        await this.preloader.preloadEntity(contestKey, {
          contestId: event.aggregateId,
          isOpen: true,
          openedAt: Date.now(),
        });
        warmedKeys.push(contestKey);

        await this.preloader.preloadEntity(leaderboardKey, {
          contestId: event.aggregateId,
          ranks: [],
          totalParticipants: 0,
        });
        warmedKeys.push(leaderboardKey);
        break;
      }
    }

    const duration = Date.now() - startTime;
    this.totalDurationSum += duration;
    this.totalWarmed += warmedKeys.length;

    this.logger.log(
      `Cache warming completed for ${event.eventType} in ${duration}ms (${warmedKeys.length} keys preloaded)`
    );

    return warmedKeys;
  }

  public getTelemetry(): SubscriberTelemetry {
    const avgDuration = this.totalEvents > 0 ? this.totalDurationSum / this.totalEvents : 0;
    return {
      totalEventsProcessed: this.totalEvents,
      totalEntitiesWarmed: this.totalWarmed,
      totalWarmupCyclesMs: this.totalDurationSum,
      averageWarmupLatencyMs: Math.round(avgDuration * 100) / 100,
    };
  }

  public clear(): void {
    this.totalEvents = 0;
    this.totalWarmed = 0;
    this.totalDurationSum = 0;
    this.preloader?.clear();
  }
}
