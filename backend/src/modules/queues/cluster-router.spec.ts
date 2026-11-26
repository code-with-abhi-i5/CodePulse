import { ClusterRouterService } from './cluster-router.service';

describe('ClusterRouterService', () => {
  let service: ClusterRouterService;

  beforeEach(() => {
    service = new ClusterRouterService();
  });

  it('should pin hash tags to the exact same hash slot across keys', () => {
    const k1 = service.formatPinnedKey('b10', 'events');
    const k2 = service.formatPinnedKey('b10', 'presence');
    expect(service.computeHashSlot(k1)).toBe(service.computeHashSlot(k2));
  });
});
