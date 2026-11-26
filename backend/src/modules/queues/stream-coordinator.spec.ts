import { StreamCoordinatorService } from './stream-coordinator.service';

describe('StreamCoordinatorService', () => {
  let service: StreamCoordinatorService;

  beforeEach(() => {
    service = new StreamCoordinatorService();
  });

  it('should evenly rebalance partitions across active consumers', () => {
    const map = service.rebalancePartitions(['c1', 'c2'], [0, 1, 2, 3]);
    expect(map.get('c1')).toEqual([0, 2]);
    expect(map.get('c2')).toEqual([1, 3]);
  });
});
