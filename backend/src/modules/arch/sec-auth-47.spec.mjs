import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SuspiciousActivityGeoAlertEngineService } from './sec-auth-47.service.ts';

describe('SuspiciousActivityGeoAlertEngineService (SEC-AUTH-47)', () => {
  it('detects impossible travel anomalies and flags suspicious new logins', () => {
    const engine = new SuspiciousActivityGeoAlertEngineService(800);
    const userId = 'usr_geo_99';
    const now = Date.now();

    // Login 1: San Francisco
    const login1 = {
      userId,
      ip: '198.51.100.1',
      location: { country: 'US', city: 'San Francisco', lat: 37.7749, lon: -122.4194 },
      timestamp: now
    };
    const res1 = engine.evaluateLogin(login1);
    assert.strictEqual(res1.isSuspicious, false);

    // Login 2: London 30 minutes later (distance ~8600 km in 0.5h = 17,200 km/h)
    const login2 = {
      userId,
      ip: '198.51.100.2',
      location: { country: 'GB', city: 'London', lat: 51.5074, lon: -0.1278 },
      timestamp: now + 1800000
    };
    const res2 = engine.evaluateLogin(login2);
    assert.strictEqual(res2.isSuspicious, true);
    assert.match(res2.reason, /Impossible travel detected/i);
    assert.strictEqual(res2.shouldNotify, true);
  });
});
