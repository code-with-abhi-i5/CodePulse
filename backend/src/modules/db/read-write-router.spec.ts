import { ReadWriteRouterService } from './read-write-router.service';

describe('ReadWriteRouterService', () => {
  let service: ReadWriteRouterService;

  beforeEach(() => {
    service = new ReadWriteRouterService();
    service.registerReplica('postgres-rep-1', 10);
  });

  it('routes write operations to primary and read operations to replica', () => {
    expect(service.routeQuery('INSERT INTO users VALUES (1)').target).toBe('primary');
    expect(service.routeQuery('SELECT * FROM users').target).toBe('replica');
  });
});
