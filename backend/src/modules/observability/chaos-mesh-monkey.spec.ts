import { ChaosMeshMonkeyService } from './chaos-mesh-monkey.service';

describe('ChaosMeshMonkeyService', () => {
  let service: ChaosMeshMonkeyService;
  beforeEach(() => { service = new ChaosMeshMonkeyService(); });
  it('registers chaos experiment', () => {
    const id = service.registerExperiment({ name: 'test', targetService: 'auth', durationMs: 1000 });
    expect(id).toContain('chaos-auth');
  });
});
