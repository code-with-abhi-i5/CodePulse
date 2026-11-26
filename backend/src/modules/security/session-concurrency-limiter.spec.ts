import { SessionConcurrencyLimiterService } from './session-concurrency-limiter.service';

describe('SessionConcurrencyLimiterService', () => {
  let service: SessionConcurrencyLimiterService;

  beforeEach(() => {
    service = new SessionConcurrencyLimiterService();
  });

  it('enforces maximum concurrent sessions by kicking out oldest session', () => {
    service.registerSession('u1', 's1', 2);
    service.registerSession('u1', 's2', 2);
    const kick = service.registerSession('u1', 's3', 2);
    expect(kick.kickedSessionId).toBe('s1');
    expect(service.getActiveSessions('u1')).toEqual(['s2', 's3']);
  });
});
