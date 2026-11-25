import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DeviceAuthorizationGrantService } from './sec-auth-31.service.ts';

describe('DeviceAuthorizationGrantService (SEC-AUTH-31)', () => {
  it('manages RFC 8628 device flow with user code approval and token issuance', () => {
    const service = new DeviceAuthorizationGrantService();
    const session = service.initiateDeviceFlow('https://codepulse.io/activate');

    assert.ok(session.deviceCode.length > 20);
    assert.ok(session.userCode.includes('-'));

    // Polling before approval returns PENDING
    assert.strictEqual(service.pollDeviceToken(session.deviceCode).status, 'PENDING');

    // User enters code in browser and approves
    const approved = service.approveUserCode(session.userCode, 'user-cli-100');
    assert.strictEqual(approved, true);

    // Polling now returns APPROVED and token
    const pollRes = service.pollDeviceToken(session.deviceCode);
    assert.strictEqual(pollRes.status, 'APPROVED');
    assert.ok(pollRes.token.startsWith('cp_dev_'));
  });
});
