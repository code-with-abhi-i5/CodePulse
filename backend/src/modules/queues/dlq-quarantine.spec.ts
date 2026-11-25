import { DlqQuarantineService } from './dlq-quarantine.service';

describe('DlqQuarantineService', () => {
  let service: DlqQuarantineService;

  beforeEach(() => {
    service = new DlqQuarantineService();
  });

  it('should retry with backoff for transient failures under max attempts', () => {
    const res = service.processFailure('job-1', 'Transient Network Error', 2, 5);
    expect(res.action).toBe('retry');
    expect(res.delayMs).toBeGreaterThan(1000);
  });

  it('should quarantine jobs that exceed max attempts', () => {
    const res = service.processFailure('job-2', 'Fatal OutOfMemory', 5, 5);
    expect(res.action).toBe('quarantine');
  });
});
