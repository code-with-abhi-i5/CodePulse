import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GrpcKeepaliveSupervisorService } from './api-int-21.service.ts';

describe('GrpcKeepaliveSupervisorService (API-INT-21)', () => {
  it('manages keepalive intervals and flags timed out channels', () => {
    const supervisor = new GrpcKeepaliveSupervisorService({ pingIntervalMs: 1000, pingTimeoutMs: 500, permitWithoutStream: true });
    const channel = 'chan-1';

    assert.strictEqual(supervisor.shouldSendPing(channel, 1000), true);
    supervisor.recordPing(channel, 1000);
    assert.strictEqual(supervisor.shouldSendPing(channel, 1500), false);
    assert.strictEqual(supervisor.shouldSendPing(channel, 2100), true);

    // Timeout check: last ping at 1000, no ack, now is 1600 (>500ms timeout)
    assert.strictEqual(supervisor.isChannelTimedOut(channel, 900, 1600), true);
  });
});
