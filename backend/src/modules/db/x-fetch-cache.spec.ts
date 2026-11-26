import { XFetchCacheService } from './x-fetch-cache.service';

describe('XFetchCacheService', () => {
  let service: XFetchCacheService;

  beforeEach(() => {
    service = new XFetchCacheService();
  });

  it('determines early recomputation when TTL approaches zero', () => {
    service.set('battle:state', { id: 10 }, -10, 50);
    const entry = service.get('battle:state');
    expect(entry?.needsRecompute).toBe(true);
  });
});
