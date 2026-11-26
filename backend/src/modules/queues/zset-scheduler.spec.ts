import { ZsetSchedulerService } from './zset-scheduler.service';

describe('ZsetSchedulerService', () => {
  let service: ZsetSchedulerService;

  beforeEach(() => {
    service = new ZsetSchedulerService();
  });

  it('should trigger tasks when their scheduled epoch timestamp is reached', () => {
    const now = Date.now();
    service.scheduleTask('t1', now - 10, { round: 1 });
    service.scheduleTask('t2', now + 5000, { round: 2 });

    const due = service.pollDueTasks(now);
    expect(due.length).toBe(1);
    expect(due[0].taskId).toBe('t1');
  });
});
