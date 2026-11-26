import { FairSchedulerService } from './fair-scheduler.service';

describe('FairSchedulerService', () => {
  let service: FairSchedulerService;

  beforeEach(() => {
    service = new FairSchedulerService();
  });

  it('should prioritize weighted tiers without starving free tier jobs', () => {
    service.enqueue('free', 'free-1');
    service.enqueue('enterprise', 'ent-1');
    const first = service.dequeueNext();
    expect(first?.tier).toBe('enterprise');
    const second = service.dequeueNext();
    expect(second?.tier).toBe('free');
  });
});
