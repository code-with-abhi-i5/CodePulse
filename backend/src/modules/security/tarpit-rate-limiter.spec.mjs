import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class TarpitRateLimiterService {
  constructor() {
    this.ipLogs = new Map();
    this.honeypotIps = new Set();
    this.windowMs = 60000;
    this.limit = 60;
  }

  flagHoneypotHit(ip) {
    this.honeypotIps.add(ip);
  }

  recordHit(ip) {
    const now = Date.now();
    if (!this.ipLogs.has(ip)) this.ipLogs.set(ip, []);
    const timestamps = this.ipLogs.get(ip);
    while (timestamps.length > 0 && timestamps[0] <= now - this.windowMs) {
      timestamps.shift();
    }
    timestamps.push(now);

    const isHoneypot = this.honeypotIps.has(ip);
    const reputation = isHoneypot ? 0 : Math.max(0, 100 - timestamps.length);
    const allowed = timestamps.length <= this.limit && !isHoneypot;
    const delayMs = isHoneypot ? 5000 : (timestamps.length > this.limit ? 2000 : 0);

    return { allowed, delayMs, reputation };
  }
}

describe('TarpitRateLimiterService', () => {
  it('enforces sliding window limits and tarpits honeypot abusers', () => {
    const service = new TarpitRateLimiterService();
    const r1 = service.recordHit('10.0.0.1');
    assert.equal(r1.allowed, true);
    assert.equal(r1.delayMs, 0);

    service.flagHoneypotHit('10.0.0.2');
    const rBlocked = service.recordHit('10.0.0.2');
    assert.equal(rBlocked.allowed, false);
    assert.equal(rBlocked.delayMs, 5000);
  });
});
