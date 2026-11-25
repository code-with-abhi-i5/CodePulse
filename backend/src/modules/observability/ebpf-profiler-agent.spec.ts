import { EbpfProfilerAgentService } from './ebpf-profiler-agent.service';

describe('EbpfProfilerAgentService', () => {
  let service: EbpfProfilerAgentService;
  beforeEach(() => { service = new EbpfProfilerAgentService(); });
  it('computes off-cpu stats', () => {
    expect(service.computeStats().sampleCount).toBe(0);
  });
});
