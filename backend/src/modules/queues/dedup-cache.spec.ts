import { DedupCacheService } from './dedup-cache.service';

describe('DedupCacheService', () => {
  let service: DedupCacheService;

  beforeEach(() => {
    service = new DedupCacheService();
  });

  it('should identify duplicate signatures within the sliding TTL window', () => {
    const sig = service.generateSignature({ event: 'submission', id: 42 });
    expect(service.isDuplicate(sig)).toBe(false);
    expect(service.isDuplicate(sig)).toBe(true);
  });
});
