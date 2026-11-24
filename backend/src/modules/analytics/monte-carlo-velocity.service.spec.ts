import { BadRequestException } from '@nestjs/common';
import { MonteCarloVelocityService } from './monte-carlo-velocity.service';

describe('MonteCarloVelocityService (10,000-Trial Forecasting & Risk Assessment)', () => {
  let service: MonteCarloVelocityService;

  beforeEach(() => {
    service = new MonteCarloVelocityService();
  });

  describe('extractDailyThroughput validation', () => {
    it('throws BadRequestException if historical sprint day sample array is empty', () => {
      expect(() => service.extractDailyThroughput([])).toThrow(BadRequestException);
    });

    it('throws BadRequestException if history contains zero completed tasks across all days', () => {
      const zeroHistory = [
        { date: '2026-11-01', completedTasks: 0 },
        { date: '2026-11-02', completedTasks: 0 },
      ];
      expect(() => service.extractDailyThroughput(zeroHistory)).toThrow(
        'Historical throughput must contain at least one completed task',
      );
    });

    it('computes correct mean, stdDev, min, and max for throughput samples', () => {
      const history = [
        { date: '2026-11-01', completedTasks: 2 },
        { date: '2026-11-02', completedTasks: 4 },
        { date: '2026-11-03', completedTasks: 6 },
      ];
      const stats = service.extractDailyThroughput(history);
      expect(stats.mean).toBe(4);
      expect(stats.min).toBe(2);
      expect(stats.max).toBe(6);
      expect(stats.samples).toEqual([2, 4, 6]);
    });
  });

  describe('runMonteCarloForecast 10,000 Iterations Execution', () => {
    it('executes 10,000 Monte Carlo simulation runs in under 150ms with ordered P50 <= P85 <= P95 forecasts', () => {
      const history = [
        { date: '2026-11-01', completedTasks: 2 },
        { date: '2026-11-02', completedTasks: 5 },
        { date: '2026-11-03', completedTasks: 1 },
        { date: '2026-11-04', completedTasks: 4 },
        { date: '2026-11-05', completedTasks: 3 },
        { date: '2026-11-06', completedTasks: 0 },
        { date: '2026-11-07', completedTasks: 6 },
      ];

      const result = service.runMonteCarloForecast({
        remainingTasks: 30,
        history,
        iterations: 10_000,
        startDateIso: '2026-11-23T00:00:00.000Z',
        targetDeadlineIso: '2026-12-08T00:00:00.000Z',
        seed: 1337,
        backlogTasks: [
          {
            taskId: 'TASK-901',
            title: 'Distributed Raft Snapshot Compaction',
            storyPoints: 13,
            historicalVarianceCoeff: 0.72,
            blockedDependencies: 1,
          },
          {
            taskId: 'TASK-902',
            title: 'Update Footer Copyright Year',
            storyPoints: 1,
            historicalVarianceCoeff: 0.1,
          },
        ],
      });

      expect(result.iterations).toBe(10_000);
      expect(result.executionTimeMs).toBeLessThan(150);
      expect(result.percentiles.p50Days).toBeLessThanOrEqual(result.percentiles.p85Days);
      expect(result.percentiles.p85Days).toBeLessThanOrEqual(result.percentiles.p95Days);
      expect(result.fanChart.length).toBeGreaterThan(1);
      expect(result.riskFactors).toHaveLength(1);
      expect(result.riskFactors[0].taskId).toBe('TASK-901');
      expect(result.probabilityOfMeetingDeadline).toBeGreaterThanOrEqual(0);
      expect(result.probabilityOfMeetingDeadline).toBeLessThanOrEqual(100);
    });

    it('calculates 100% probability when deadline is exceptionally generous', () => {
      const history = [{ date: '2026-11-01', completedTasks: 10 }];
      const result = service.runMonteCarloForecast({
        remainingTasks: 5,
        history,
        iterations: 1_000,
        startDateIso: '2026-11-01T00:00:00.000Z',
        targetDeadlineIso: '2026-12-01T00:00:00.000Z', // 30 days for 5 tasks at 10/day
      });
      expect(result.probabilityOfMeetingDeadline).toBe(100);
    });
  });

  describe('assessRiskFactors', () => {
    it('ranks and categorizes high variance items with reasons', () => {
      const tasks = [
        {
          taskId: 'T1',
          title: 'High Risk Task',
          storyPoints: 8,
          historicalVarianceCoeff: 0.8,
          blockedDependencies: 2,
        },
        {
          taskId: 'T2',
          title: 'Low Risk Task',
          storyPoints: 2,
          historicalVarianceCoeff: 0.1,
          blockedDependencies: 0,
        },
      ];

      const assessment = service.assessRiskFactors(tasks, 10, 15);
      expect(assessment.length).toBe(1);
      expect(assessment[0].taskId).toBe('T1');
      expect(assessment[0].riskLevel).toBe('HIGH');
      expect(assessment[0].reason).toContain('high throughput variance');
      expect(assessment[0].reason).toContain('unresolved upstream dependency blocker');
      expect(assessment[0].reason).toContain('oversized scope');
    });
  });
});
