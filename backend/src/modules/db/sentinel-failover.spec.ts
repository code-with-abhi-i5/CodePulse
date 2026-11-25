import { SentinelFailoverService } from './sentinel-failover.service';

describe('SentinelFailoverService', () => {
  let service: SentinelFailoverService;

  beforeEach(() => {
    service = new SentinelFailoverService();
  });

  it('switches masters and reconnects subscriptions during failover', () => {
    service.subscribeChannel('match:updates');
    const res = service.handleFailoverEvent('redis-node-2:6379');
    expect(res.newMaster).toBe('redis-node-2:6379');
    expect(res.reconnectedSubs).toBe(1);
  });
});
