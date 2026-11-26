import { SloBurnRateCalculatorService } from './slo-burn-rate-calculator.service';

describe('SloBurnRateCalculatorService', () => {
  let service: SloBurnRateCalculatorService;
  beforeEach(() => { service = new SloBurnRateCalculatorService(); });
  it('handles zero requests cleanly', () => {
    const res = service.calculateBurnRate({ serviceName: 'api', sliName: 'err', sloTarget: 0.99, windowMinutes: 60 }, 0, 0);
    expect(res.burnRate).toBe(0);
  });
});
