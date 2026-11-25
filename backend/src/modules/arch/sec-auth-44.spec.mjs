import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HoneypotVulnerabilityScannerDetectorService } from './sec-auth-44.service.ts';

describe('HoneypotVulnerabilityScannerDetectorService (SEC-AUTH-44)', () => {
  it('flags malicious vulnerability scans on honeypot endpoints and bans offending IPs', () => {
    const detector = new HoneypotVulnerabilityScannerDetectorService(2);
    const ip = '198.51.100.42';

    // Normal path
    const norm = detector.inspectRequest('/api/battles/list', ip);
    assert.strictEqual(norm.isTrap, false);
    assert.strictEqual(norm.banned, false);

    // Trap 1: /.env
    const trap1 = detector.inspectRequest('/.env', ip);
    assert.strictEqual(trap1.isTrap, true);
    assert.strictEqual(trap1.banned, false);

    // Trap 2: /wp-login.php -> reaches threshold of 2, triggers ban
    const trap2 = detector.inspectRequest('/wp-login.php', ip);
    assert.strictEqual(trap2.isTrap, true);
    assert.strictEqual(trap2.banned, true);

    // IP is now globally banned
    assert.strictEqual(detector.isIpBanned(ip), true);
  });
});
