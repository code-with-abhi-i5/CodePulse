import { Injectable, NestMiddleware, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SystemMetricsService } from '../services/system-metrics.service';

export enum TrafficPriorityTier {
  TIER_1_CRITICAL = 1, // Active Battle WebSockets / Live Battle Actions (Critical — never shed)
  TIER_2_HIGH = 2, // Authentication, Matchmaking Queue, Battle Join (High)
  TIER_3_MEDIUM = 3, // Profile, Leaderboards, Repositories, Feeds (Medium)
  TIER_4_LOW = 4, // Background Sync, Analytics, Data Exports, Inspector (Low)
}

export interface LoadShedderStats {
  totalRequests: number;
  admittedRequests: number;
  shedRequests: number;
  shedByTier: Record<TrafficPriorityTier, number>;
  currentSystemHealth: 'GREEN' | 'YELLOW' | 'RED';
  eventLoopLagMs: number;
}

@Injectable()
export class LoadShedderMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoadShedderMiddleware.name);

  // Inactivity / Shedding thresholds
  private readonly TIER_4_SHED_LAG_THRESHOLD_MS = 100; // > 100ms lag sheds Tier 4
  private readonly TIER_3_SHED_LAG_THRESHOLD_MS = 250; // > 250ms lag sheds Tier 3
  private readonly RETRY_AFTER_SECONDS = 30;

  // Stats tracking
  private totalRequests = 0;
  private admittedRequests = 0;
  private shedRequests = 0;
  private shedByTier: Record<TrafficPriorityTier, number> = {
    [TrafficPriorityTier.TIER_1_CRITICAL]: 0,
    [TrafficPriorityTier.TIER_2_HIGH]: 0,
    [TrafficPriorityTier.TIER_3_MEDIUM]: 0,
    [TrafficPriorityTier.TIER_4_LOW]: 0,
  };

  constructor(private readonly systemMetrics: SystemMetricsService) {}

  /**
   * Classifies an incoming request into one of the 4 Traffic Priority Tiers:
   * - Tier 1: Active Battle WebSockets & Real-time Live Matches (Never shed)
   * - Tier 2: Authentication, Password Reset, Matchmaking Entry (High)
   * - Tier 3: Profile views, Leaderboards, Repository details, Friends (Medium)
   * - Tier 4: Analytics exports, GitHub sync, Admin reports, Inspections (Low)
   */
  classifyRequestPriority(req: Request): TrafficPriorityTier {
    const url = req.originalUrl || req.url || '';
    const path = url.toLowerCase();
    const upgradeHeader = req.headers['upgrade'];

    // 1. Tier 1: WebSocket Upgrade or Critical live battle pathways
    if (
      upgradeHeader === 'websocket' ||
      path.includes('/battles/live') ||
      path.includes('/battles/action') ||
      path.includes('/battles/submit')
    ) {
      return TrafficPriorityTier.TIER_1_CRITICAL;
    }

    // 2. Tier 2: Authentication, Tokens, Matchmaking queue, Join battle
    if (
      path.includes('/auth') ||
      path.includes('/login') ||
      path.includes('/signup') ||
      path.includes('/battles/matchmaking') ||
      path.includes('/battles/join')
    ) {
      return TrafficPriorityTier.TIER_2_HIGH;
    }

    // 3. Tier 4: Background sync, Heavy analytical exports, Inspector, Reports
    if (
      path.includes('/sync') ||
      path.includes('/analytics') ||
      path.includes('/reports') ||
      path.includes('/export') ||
      path.includes('/repository-inspector')
    ) {
      return TrafficPriorityTier.TIER_4_LOW;
    }

    // 4. Tier 3: Default User-facing views (Profiles, Leaderboards, Challenges, Repositories)
    return TrafficPriorityTier.TIER_3_MEDIUM;
  }

  use(req: Request, res: Response, next: NextFunction): void {
    this.totalRequests++;

    const lagMs = this.systemMetrics.getEventLoopLagMs();
    const priority = this.classifyRequestPriority(req);

    // Rule 1: Tier 1 (Critical battle websockets / live match actions) is NEVER shed under any circumstances
    if (priority === TrafficPriorityTier.TIER_1_CRITICAL) {
      this.admittedRequests++;
      return next();
    }

    // Rule 2: If Event Loop Delay > 250ms, shed Tier 3 (Medium) & Tier 4 (Low)
    if (lagMs >= this.TIER_3_SHED_LAG_THRESHOLD_MS) {
      if (
        priority === TrafficPriorityTier.TIER_3_MEDIUM ||
        priority === TrafficPriorityTier.TIER_4_LOW
      ) {
        return this.shedTraffic(res, priority, lagMs);
      }
    }

    // Rule 3: If Event Loop Delay > 100ms, shed Tier 4 (Low priority background & analytics)
    if (lagMs >= this.TIER_4_SHED_LAG_THRESHOLD_MS) {
      if (priority === TrafficPriorityTier.TIER_4_LOW) {
        return this.shedTraffic(res, priority, lagMs);
      }
    }

    // Admitted request (healthy state or high-priority request)
    this.admittedRequests++;
    next();
  }

  private shedTraffic(
    res: Response,
    tier: TrafficPriorityTier,
    lagMs: number,
  ): void {
    this.shedRequests++;
    this.shedByTier[tier]++;

    this.logger.warn(
      `[Load Shedder] Shedding Tier ${tier} request! Event loop lag: ${lagMs}ms (Threshold: ${
        tier === TrafficPriorityTier.TIER_4_LOW
          ? this.TIER_4_SHED_LAG_THRESHOLD_MS
          : this.TIER_3_SHED_LAG_THRESHOLD_MS
      }ms)`,
    );

    res.setHeader('Retry-After', this.RETRY_AFTER_SECONDS);
    res.setHeader('X-Load-Shed-Tier', tier);
    res.setHeader('X-Event-Loop-Lag-Ms', lagMs);

    res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      error: 'Service Unavailable',
      message:
        'Server is experiencing a high-traffic surge. Non-critical traffic temporarily shed to protect active live battles.',
      priorityTier: tier,
      eventLoopLagMs: lagMs,
      retryAfterSeconds: this.RETRY_AFTER_SECONDS,
    });
  }

  /**
   * Returns stats regarding total admitted vs shed requests.
   */
  getStats(): LoadShedderStats {
    const lagMs = this.systemMetrics.getEventLoopLagMs();
    let currentSystemHealth: LoadShedderStats['currentSystemHealth'] = 'GREEN';

    if (lagMs >= this.TIER_3_SHED_LAG_THRESHOLD_MS) {
      currentSystemHealth = 'RED';
    } else if (lagMs >= this.TIER_4_SHED_LAG_THRESHOLD_MS) {
      currentSystemHealth = 'YELLOW';
    }

    return {
      totalRequests: this.totalRequests,
      admittedRequests: this.admittedRequests,
      shedRequests: this.shedRequests,
      shedByTier: { ...this.shedByTier },
      currentSystemHealth,
      eventLoopLagMs: lagMs,
    };
  }
}
