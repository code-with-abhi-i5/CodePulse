import assert from 'node:assert/strict';
import { SslCertRenewalDaemonService } from './devops-infra-16.service.ts';

const daemon = new SslCertRenewalDaemonService(30);

const now = 1000000000;
const expiresSoon = now + 15 * 24 * 60 * 60 * 1000;
daemon.registerCertificate('api.codepulse.io', expiresSoon);

const renewed = daemon.checkAndRenew('api.codepulse.io', now);
assert.strictEqual(renewed, true);

const status = daemon.getStatus('api.codepulse.io');
assert.strictEqual(status.status, 'renewed');
assert.ok(status.expiresAt > now + 60 * 24 * 60 * 60 * 1000);

console.log('Issue #3096 [DEVOPS-INFRA-16] spec passed successfully.');
