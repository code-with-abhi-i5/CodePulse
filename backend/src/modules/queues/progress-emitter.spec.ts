import { ProgressEmitterService } from './progress-emitter.service';

describe('ProgressEmitterService', () => {
  let service: ProgressEmitterService;

  beforeEach(() => {
    service = new ProgressEmitterService();
  });

  it('should throttle micro-percentage increments below delta threshold', () => {
    service.emitProgress('j1', 10);
    expect(service.shouldThrottle('j1', 12)).toBe(true);
    expect(service.shouldThrottle('j1', 20)).toBe(false);
  });
});
