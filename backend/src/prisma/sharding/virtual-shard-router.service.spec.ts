import { VirtualShardRouterService } from './virtual-shard-router.service';

describe('VirtualShardRouterService', () => {
  let router: VirtualShardRouterService;

  beforeEach(() => {
    router = new VirtualShardRouterService();
  });

  it('should deterministically route tenants to virtual and physical shards', () => {
    const route1 = router.routeTenant('tenant-code-pulse');
    const route2 = router.routeTenant('tenant-code-pulse');

    expect(route1.virtualShardId).toBe(route2.virtualShardId);
    expect(route1.targetPhysicalShardId).toBe(route2.targetPhysicalShardId);
  });

  it('should support live online migration of virtual shards', () => {
    const route = router.routeTenant('tenant-migrating');
    const oldPhysical = route.targetPhysicalShardId;
    const newPhysical = oldPhysical === 'shard-0' ? 'shard-1' : 'shard-0';

    const migrated = router.migrateVirtualShard(route.virtualShardId, newPhysical);
    expect(migrated).toBe(true);

    const updatedRoute = router.routeTenant('tenant-migrating');
    expect(updatedRoute.targetPhysicalShardId).toBe(newPhysical);
  });
});
