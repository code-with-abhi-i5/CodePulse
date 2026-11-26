import { WorkerAutoscalerService } from './worker-autoscaler.service';

describe('WorkerAutoscalerService', () => {
  let service: WorkerAutoscalerService;

  beforeEach(() => {
    service = new WorkerAutoscalerService();
  });

  it('should scale up concurrency when p95 latency and queue depth are high', () => {
    const target = service.calculateTargetConcurrency(10, 2500, 600);
    expect(target).toBe(15);
  });

  it('should scale down concurrency when latency is low and queue is shallow', () => {
    const target = service.calculateTargetConcurrency(10, 150, 5);
    expect(target).toBe(8);
  });
});
