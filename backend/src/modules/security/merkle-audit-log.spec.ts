import { MerkleAuditLogService } from './merkle-audit-log.service';

describe('MerkleAuditLogService', () => {
  let service: MerkleAuditLogService;

  beforeEach(() => {
    service = new MerkleAuditLogService();
  });

  it('maintains cryptographically chained audit logs with verifiable Merkle root', () => {
    const e1 = service.appendAuditAction('admin-1', 'USER_ROLE_PROMOTION', { user: 42 });
    const e2 = service.appendAuditAction('admin-1', 'IP_UNBAN', { ip: '1.2.3.4' });
    expect(service.verifyChainIntegrity()).toBe(true);
    expect(e2.merkleRoot).toBeDefined();
  });
});
