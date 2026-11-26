import { DynamicTieBreakerService } from './dynamic-tie-breaker.service';

describe('DynamicTieBreakerService', () => {
  let service: DynamicTieBreakerService;
  beforeEach(() => { service = new DynamicTieBreakerService(); });
  it('breaks ties using complexity', () => {
    const res = service.breakTie(
      { userId: 'u1', testsPassed: 10, totalTests: 10, cyclomaticComplexity: 3, runtimeMs: 50, memoryKb: 1024 },
      { userId: 'u2', testsPassed: 10, totalTests: 10, cyclomaticComplexity: 5, runtimeMs: 50, memoryKb: 1024 }
    );
    expect(res.winnerId).toBe('u1');
  });
});
