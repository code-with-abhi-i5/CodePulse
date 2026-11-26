import { TraceFlamegraphVisualizerService } from './trace-flamegraph-visualizer.service';

describe('TraceFlamegraphVisualizerService', () => {
  let service: TraceFlamegraphVisualizerService;
  beforeEach(() => { service = new TraceFlamegraphVisualizerService(); });
  it('returns null on empty spans', () => {
    expect(service.buildFlamegraph([])).toBeNull();
  });
});
