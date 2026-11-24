import { DistributedLockService, RedlockLease } from './distributed-lock.service';

describe('DistributedLockService (Multi-Instance Redlock & Fencing Tokens #1286)', () => {
  let lockService: DistributedLockService;

  beforeEach(() => {
    lockService = new DistributedLockService();
  });

  afterEach(() => {
    lockService.onModuleDestroy();
  });

  it('successfully acquires Redlock across 3 instances and generates monotonically increasing fencing token', async () => {
    const resource = 'battle:arena-99:score';
    const lease1 = await lockService.acquireLock(resource, 5000);

    expect(lease1).not.toBeNull();
    expect(lease1?.resourceKey).toBe(resource);
    expect(lease1?.quorumCount).toBe(3); // All 3 nodes agreed
    expect(lease1?.fencingToken).toBeGreaterThanOrEqual(1001);

    // Release and acquire again: next token must be strictly greater
    await lockService.releaseLock(lease1!);
    const lease2 = await lockService.acquireLock(resource, 5000);

    expect(lease2).not.toBeNull();
    expect(lease2!.fencingToken).toBeGreaterThan(lease1!.fencingToken);
  });

  it('rejects concurrent lock acquisition while resource is locked', async () => {
    const resource = 'battle:arena-42:state';
    const lease1 = await lockService.acquireLock(resource, 4000);
    expect(lease1).not.toBeNull();

    // Client 2 attempts to acquire the same lock while held by Client 1
    const lease2 = await lockService.acquireLock(resource, 2000, { retryCount: 1 });
    expect(lease2).toBeNull();

    // After release, Client 2 should succeed
    const released = await lockService.releaseLock(lease1!);
    expect(released).toBe(true);

    const lease3 = await lockService.acquireLock(resource, 4000);
    expect(lease3).not.toBeNull();
  });

  it('tolerates 1 node failure in a 3-node cluster and successfully achieves quorum', async () => {
    const resource = 'battle:arena-resilience:pool';

    // Simulate Node 3 failure (down / partitioned)
    lockService.setNodeState(2, false);

    // Quorum is 2 out of 3; Nodes 1 & 2 are alive
    const lease = await lockService.acquireLock(resource, 5000);
    expect(lease).not.toBeNull();
    expect(lease?.quorumCount).toBe(2);
    expect(lease?.participatingNodes.length).toBe(2);

    const released = await lockService.releaseLock(lease!);
    expect(released).toBe(true);
  });

  it('fails to acquire lock when quorum cannot be reached (2 out of 3 nodes down)', async () => {
    const resource = 'battle:arena-partition:fail';

    // Simulate Nodes 2 & 3 down
    lockService.setNodeState(1, false);
    lockService.setNodeState(2, false);

    const lease = await lockService.acquireLock(resource, 3000, { retryCount: 1 });
    expect(lease).toBeNull();
  });

  it('validates fencing tokens and rejects zombie / stale mutations', () => {
    const resource = 'battle:arena-fencing:turn';

    // Normal progression
    expect(lockService.validateFencingToken(resource, 1050)).toBe(true);
    expect(lockService.validateFencingToken(resource, 1051)).toBe(true);
    expect(lockService.validateFencingToken(resource, 1055)).toBe(true);

    // Stale mutation arrives late (zombie token 1049 < 1055)
    const isValid = lockService.validateFencingToken(resource, 1049);
    expect(isValid).toBe(false);
  });

  it('successfully executes atomic operations inside runWithRedlock wrapper', async () => {
    const resource = 'battle:arena-critical:payout';
    let balance = 100;

    const finalBalance = await lockService.runWithRedlock(resource, 4000, async (lease) => {
      expect(lease.fencingToken).toBeDefined();
      balance += 50;
      return balance;
    });

    expect(finalBalance).toBe(150);

    // Lock must be released immediately after block execution
    const reacquired = await lockService.acquireLock(resource, 2000);
    expect(reacquired).not.toBeNull();
  });

  it('extends existing lock lease validity via extendLock', async () => {
    const resource = 'battle:arena-long-running:mutation';
    const lease = await lockService.acquireLock(resource, 3000);
    expect(lease).not.toBeNull();

    const extended = await lockService.extendLock(lease!, 8000);
    expect(extended).toBe(true);
    expect(lease!.validityTimeMs).toBe(8000);
  });
});
