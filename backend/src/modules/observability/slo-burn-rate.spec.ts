import { ErrorBudgetTrackerService } from './error-budget-tracker.service';
import { SloBurnRateService } from './slo-burn-rate.service';

describe('SloBurnRateService & ErrorBudgetTrackerService', () => {
  let tracker: ErrorBudgetTrackerService;
  let burnService: SloBurnRateService;

  beforeEach(() => {
    tracker = new ErrorBudgetTrackerService();
    burnService = new SloBurnRateService(tracker);
  });

  describe('ErrorBudgetTrackerService calculations', () => {
    it('should compute actual SLI and remaining budget correctly', () => {
      // 990 good, 10 bad events out of 1000 = 99.0% SLI
      for (let i = 0; i < 990; i++) {
        tracker.recordEvent('availability', true);
      }
      for (let i = 0; i < 10; i++) {
        tracker.recordEvent('availability', false);
      }

      const status = tracker.getBudgetStatus('availability');
      expect(status.targetPercent).toBe(99.9);
      expect(status.actualSliPercent).toBe(99.0);
      expect(status.allowedErrorBudgetPercent).toBe(0.1);
      // Actual error rate is 1.0%, which is 10x the allowed budget (1000% consumed)
      expect(status.consumedErrorBudgetPercent).toBe(1000);
      expect(status.isBudgetExhausted).toBe(true);
    });
  });

  describe('SloBurnRateService multi-window multi-burn-rate alerting', () => {
    it('should not fire page alert if burn rate occurs only in a short window without long window confirmation', () => {
      const now = Date.now();
      // Record only 10 bad events in last 2 minutes
      for (let i = 0; i < 10; i++) {
        tracker.recordEvent('availability', false, now - 60 * 1000);
      }

      const alerts = burnService.evaluateBurnRate('availability', now);
      // Should not trigger PAGE alerts because long 1h window does not meet minimum sample size / sustained criteria
      const pageAlerts = alerts.filter((a) => a.channel === 'PAGE');
      expect(pageAlerts.length).toBe(0);
    });

    it('should fire PAGE alert when sustained severe burn rate (>14.4x) spans both long and short windows', () => {
      const now = Date.now();
      // Allowed error rate for 99.9% is 0.001. A 14.4x burn rate = 0.0144 (1.44% error rate)
      // Populate 1000 events: 980 good, 20 bad (2.0% error rate = 20x burn rate)
      for (let i = 0; i < 980; i++) {
        tracker.recordEvent('availability', true, now - (i * 2000)); // distributed over last 30 mins
      }
      for (let i = 0; i < 20; i++) {
        tracker.recordEvent('availability', false, now - (i * 1000)); // distributed over last few mins
      }

      const alerts = burnService.evaluateBurnRate('availability', now);
      const pageAlert = alerts.find((a) => a.channel === 'PAGE');

      expect(pageAlert).toBeDefined();
      expect(pageAlert?.burnRate).toBeGreaterThanOrEqual(14.4);
      expect(pageAlert?.message).toContain('PAGE');
    });
  });
});
