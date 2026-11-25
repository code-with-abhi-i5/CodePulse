import { MvccCoordinatorService } from './mvcc-coordinator.service';

describe('MvccCoordinatorService', () => {
  let service: MvccCoordinatorService;

  beforeEach(() => {
    service = new MvccCoordinatorService();
  });

  it('prevents lost updates by rejecting stale MVCC versions', () => {
    const u1 = service.verifyAndUpdate('user-1', 1, { name: 'Alice' });
    expect(u1.success).toBe(true);

    const uStale = service.verifyAndUpdate('user-1', 1, { name: 'Bob' });
    expect(uStale.success).toBe(false);
  });
});
