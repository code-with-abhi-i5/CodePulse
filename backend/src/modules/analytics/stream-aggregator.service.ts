import { Injectable, Logger, Optional } from '@nestjs/common';
import { TumblingWindowService } from './tumbling-window.service';

export interface RollingDoraMetrics {
  deploymentFrequencyPerDay: number;
  changeFailureRatePercent: number;
  meanLeadTimeMinutes: number;
  meanTimeToRestoreMinutes: number;
  totalDeployments: number;
  totalIncidents: number;
}

export interface RollingVelocityMetrics {
  activeDevelopersCount: number;
  buildSuccessRatePercent: number;
  totalBuilds: number;
  averageBuildDurationSeconds: number;
  prReviewTurnaroundMinutes: number;
  totalPrReviewsCompleted: number;
}

@Injectable()
export class StreamAggregatorService {
  private readonly logger = new Logger(StreamAggregatorService.name);

  private readonly CATEGORY_PR = 'pr_reviews';
  private readonly CATEGORY_BUILD = 'cicd_builds';
  private readonly CATEGORY_DEV = 'dev_activity';
  private readonly CATEGORY_DEPLOY = 'deployments';
  private readonly CATEGORY_INCIDENT = 'incidents';

  constructor(
    @Optional() private readonly windowService?: TumblingWindowService
  ) {
    if (!this.windowService) {
      this.windowService = new TumblingWindowService();
    }
  }

  /**
   * Records a completed Pull Request review with duration in minutes.
   */
  public recordPrReview(prId: string, reviewerId: string, durationMinutes: number, timestamp = Date.now()): void {
    this.windowService.recordEvent(
      this.CATEGORY_PR,
      timestamp,
      true,
      durationMinutes,
      reviewerId
    );
  }

  /**
   * Records a CI/CD build execution with success/fail status and duration.
   */
  public recordBuild(buildId: string, isSuccess: boolean, durationSeconds: number, timestamp = Date.now()): void {
    this.windowService.recordEvent(
      this.CATEGORY_BUILD,
      timestamp,
      isSuccess,
      durationSeconds,
      buildId
    );
  }

  /**
   * Records active developer contributions (commits, PR actions, comments).
   */
  public recordDeveloperActivity(developerId: string, timestamp = Date.now()): void {
    this.windowService.recordEvent(
      this.CATEGORY_DEV,
      timestamp,
      true,
      0,
      developerId
    );
  }

  /**
   * Records a deployment execution with success status and lead time for changes.
   */
  public recordDeployment(deploymentId: string, isSuccess: boolean, leadTimeMinutes: number, timestamp = Date.now()): void {
    this.windowService.recordEvent(
      this.CATEGORY_DEPLOY,
      timestamp,
      isSuccess,
      leadTimeMinutes,
      deploymentId
    );
  }

  /**
   * Records a production incident resolution with recovery duration (MTTR).
   */
  public recordIncidentRecovery(incidentId: string, recoveryMinutes: number, timestamp = Date.now()): void {
    this.windowService.recordEvent(
      this.CATEGORY_INCIDENT,
      timestamp,
      true,
      recoveryMinutes,
      incidentId
    );
  }

  /**
   * Computes sub-second rolling DORA metrics over sliding time window.
   */
  public getRollingDoraMetrics(windowMs = 24 * 3600 * 1000, now = Date.now()): RollingDoraMetrics {
    const deployAgg = this.windowService.querySlidingAggregation(this.CATEGORY_DEPLOY, now, windowMs);
    const incidentAgg = this.windowService.querySlidingAggregation(this.CATEGORY_INCIDENT, now, windowMs);

    const windowDays = Math.max(1, windowMs / (24 * 3600 * 1000));
    const deploymentFrequencyPerDay = Math.round((deployAgg.totalEvents / windowDays) * 100) / 100;

    // Change failure rate: proportion of failed deployments
    const changeFailureRatePercent = Math.round((100 - deployAgg.successRatePercent) * 100) / 100;
    const meanLeadTimeMinutes = deployAgg.averageDurationMs;
    const meanTimeToRestoreMinutes = incidentAgg.averageDurationMs;

    return {
      deploymentFrequencyPerDay,
      changeFailureRatePercent,
      meanLeadTimeMinutes,
      meanTimeToRestoreMinutes,
      totalDeployments: deployAgg.totalEvents,
      totalIncidents: incidentAgg.totalEvents,
    };
  }

  /**
   * Computes sub-second rolling engineering velocity metrics.
   */
  public getRollingVelocityMetrics(windowMs = 24 * 3600 * 1000, now = Date.now()): RollingVelocityMetrics {
    const prAgg = this.windowService.querySlidingAggregation(this.CATEGORY_PR, now, windowMs);
    const buildAgg = this.windowService.querySlidingAggregation(this.CATEGORY_BUILD, now, windowMs);
    const devAgg = this.windowService.querySlidingAggregation(this.CATEGORY_DEV, now, windowMs);

    return {
      activeDevelopersCount: devAgg.distinctEntityCount,
      buildSuccessRatePercent: buildAgg.successRatePercent,
      totalBuilds: buildAgg.totalEvents,
      averageBuildDurationSeconds: buildAgg.averageDurationMs,
      prReviewTurnaroundMinutes: prAgg.averageDurationMs,
      totalPrReviewsCompleted: prAgg.totalEvents,
    };
  }

  /**
   * Memory management prune routine.
   */
  public pruneOldData(maxRetentionMs = 7 * 24 * 3600 * 1000, now = Date.now()): number {
    return this.windowService.pruneExpiredBuckets(now, maxRetentionMs);
  }

  public clear(): void {
    this.windowService.clear();
  }
}
