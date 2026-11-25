import { MicroBatcherService } from './micro-batcher.service';

describe('MicroBatcherService', () => {
  let service: MicroBatcherService;

  beforeEach(() => {
    service = new MicroBatcherService();
  });

  it('should flush when batch reaches maxSize limit', () => {
    service.setBatchLimits(2, 5000);
    service.pushRecord({ event: 1 });
    expect(service.shouldFlush()).toBe(false);
    service.pushRecord({ event: 2 });
    expect(service.shouldFlush()).toBe(true);
    expect(service.flushBatch().length).toBe(2);
  });
});
