import { TarpitRateLimiterService } from './tarpit-rate-limiter.service';

describe('TarpitRateLimiterService', () => {
  let service: TarpitRateLimiterService;

  beforeEach(() => {
    service = new TarpitRateLimiterService();
  });

  it('imposes tarpit delays on honeypot and rate-exceeded clients', () => {
    service.flagHoneypotHit('192.168.1.100');
    const status = service.recordHit('192.168.1.100');
    expect(status.allowed).toBe(false);
    expect(status.delayMs).toBe(5000);
  });
});
