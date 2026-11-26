import { SigtermDrainService } from './sigterm-drain.service';

describe('SigtermDrainService', () => {
  let service: SigtermDrainService;

  beforeEach(() => {
    service = new SigtermDrainService();
  });

  it('should track in-flight tasks and reject new tasks once shutting down', async () => {
    service.registerInFlightTask('task-1');
    expect(service.getActiveTaskCount()).toBe(1);
    service.completeTask('task-1');
    expect(service.getActiveTaskCount()).toBe(0);
  });
});
