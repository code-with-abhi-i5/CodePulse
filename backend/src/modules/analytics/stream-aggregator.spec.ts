import { TumblingWindowService } from './tumbling-window.service';
import { StreamAggregatorService } from './stream-aggregator.service';

describe('StreamAggregatorService (#1414)', () => {
  let windowService: TumblingWindowService;
  let aggregator: StreamAggregatorService;

  beforeEach(() => {
    windowService = new TumblingWindowService();
    aggregator = new StreamAggregatorService(windowService);
  });

  afterEach(() => {
    aggregator.clear();
  });

  it('should compute PR review turnaround and active reviewers within sliding window', () => {
    const baseTime = 1700000000000;

    aggregator.recordPrReview('pr-1', 'dev-alice', 45, baseTime);
    aggregator.recordPrReview('pr-2', 'dev-bob', 75, baseTime + 10000);
    aggregator.recordPrReview('pr-3', 'dev-alice', 60, baseTime + 20000);

    const metrics = aggregator.getRollingVelocityMetrics(3600000, baseTime + 30000);

    expect(metrics.totalPrReviewsCompleted).toBe(3);
    // (45 + 75 + 60) / 3 = 60 minutes
    expect(metrics.prReviewTurnaroundMinutes).toBe(60);
  });

  it('should compute CI/CD build success rate and duration accurately', () => {
    const baseTime = 1700000000000;

    aggregator.recordBuild('b-1', true, 120, baseTime);
    aggregator.recordBuild('b-2', true, 180, baseTime + 1000);
    aggregator.recordBuild('b-3', false, 90, baseTime + 2000);
    aggregator.recordBuild('b-4', true, 130, baseTime + 3000);

    const metrics = aggregator.getRollingVelocityMetrics(3600000, baseTime + 5000);

    expect(metrics.totalBuilds).toBe(4);
    // 3 out of 4 successful = 75%
    expect(metrics.buildSuccessRatePercent).toBe(75);
    // (120 + 180 + 90 + 130) / 4 = 130s
    expect(metrics.averageBuildDurationSeconds).toBe(130);
  });

  it('should calculate active developer counts across activity stream', () => {
    const baseTime = 1700000000000;

    aggregator.recordDeveloperActivity('user-1', baseTime);
    aggregator.recordDeveloperActivity('user-2', baseTime + 100);
    aggregator.recordDeveloperActivity('user-1', baseTime + 200); // duplicate action by same dev
    aggregator.recordDeveloperActivity('user-3', baseTime + 300);

    const metrics = aggregator.getRollingVelocityMetrics(3600000, baseTime + 1000);
    expect(metrics.activeDevelopersCount).toBe(3);
  });

  it('should compute real-time rolling DORA metrics without database batch queries', () => {
    const baseTime = 1700000000000;
    const oneDayMs = 24 * 3600 * 1000;

    // 4 deployments in a 1-day window: 3 success, 1 failure
    aggregator.recordDeployment('dep-1', true, 30, baseTime);
    aggregator.recordDeployment('dep-2', true, 40, baseTime + 1000);
    aggregator.recordDeployment('dep-3', false, 50, baseTime + 2000);
    aggregator.recordDeployment('dep-4', true, 60, baseTime + 3000);

    // 1 incident resolved in 15 minutes
    aggregator.recordIncidentRecovery('inc-1', 15, baseTime + 4000);

    const dora = aggregator.getRollingDoraMetrics(oneDayMs, baseTime + 10000);

    expect(dora.totalDeployments).toBe(4);
    expect(dora.deploymentFrequencyPerDay).toBe(4);
    // 1 failure out of 4 = 25% change failure rate
    expect(dora.changeFailureRatePercent).toBe(25);
    // (30 + 40 + 50 + 60) / 4 = 45m mean lead time
    expect(dora.meanLeadTimeMinutes).toBe(45);
    expect(dora.meanTimeToRestoreMinutes).toBe(15);
  });

  it('should prune expired tumbling window buckets ensuring bounded memory footprint', () => {
    const baseTime = 1700000000000;
    const sevenDaysMs = 7 * 24 * 3600 * 1000;

    // Record event 10 days ago (older than 7 days retention)
    aggregator.recordBuild('old-b', true, 100, baseTime - 10 * 24 * 3600 * 1000);
    // Record current event
    aggregator.recordBuild('new-b', true, 100, baseTime);

    const prunedCount = aggregator.pruneOldData(sevenDaysMs, baseTime);
    expect(prunedCount).toBeGreaterThan(0);

    // Query 7-day window only contains the new event
    const metrics = aggregator.getRollingVelocityMetrics(sevenDaysMs, baseTime);
    expect(metrics.totalBuilds).toBe(1);
  });
});
