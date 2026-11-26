import { DoraMetricsCalculatorService } from './dora-metrics-calculator.service';

describe('DoraMetricsCalculatorService', () => {
  let service: DoraMetricsCalculatorService;
  beforeEach(() => { service = new DoraMetricsCalculatorService(); });
  it('calculates metrics', () => {
    const m = service.calculate(1, 1, [10], [5], 0);
    expect(m.doraTier).toBe('elite');
  });
});
