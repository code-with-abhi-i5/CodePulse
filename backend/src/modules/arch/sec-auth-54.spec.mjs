import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AdminBreakGlassProtocolService } from './sec-auth-54.service.ts';

describe('AdminBreakGlassProtocolService (SEC-AUTH-54)', () => {
  it('requires multi-admin threshold approvals before issuing emergency session token', () => {
    const protocol = new AdminBreakGlassProtocolService(2);
    const session = protocol.initiateBreakGlass('admin_requester', 'prod_db_cluster', 'Outage recovery');

    assert.strictEqual(session.status, 'PENDING');

    // Requester cannot approve own request
    const selfApprove = protocol.approveBreakGlass(session.sessionId, 'admin_requester');
    assert.strictEqual(selfApprove.approved, false);
    assert.match(selfApprove.error, /Requester cannot approve/i);

    // Approver 1 (1/2 threshold)
    const app1 = protocol.approveBreakGlass(session.sessionId, 'admin_sec_1');
    assert.strictEqual(app1.approved, false);
    assert.strictEqual(session.status, 'PENDING');

    // Approver 2 (2/2 threshold reached)
    const app2 = protocol.approveBreakGlass(session.sessionId, 'admin_sec_2');
    assert.strictEqual(app2.approved, true);
    assert.strictEqual(session.status, 'APPROVED');
    assert.ok(session.sessionToken);

    assert.strictEqual(protocol.validateEmergencyToken(session.sessionToken), true);
  });
});
