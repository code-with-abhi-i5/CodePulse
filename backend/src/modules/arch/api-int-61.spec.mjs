import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GrpcHeartbeatInjectorService } from './api-int-61.service.ts';

describe('GrpcHeartbeatInjectorService (API-INT-61)', () => {
  it('injects heartbeats and tracks active gRPC streams', () => {
    const injector = new GrpcHeartbeatInjectorService(5000, 15000);
    const sentFrames = [];
    const client = {
      id: 'stream-1',
      isOpen: true,
      lastAckTimestamp: 1000,
      sendFrame: (frame) => sentFrames.push(frame),
      close: () => {}
    };

    injector.registerStream(client);
    assert.strictEqual(injector.getActiveStreamCount(), 1);

    const sent = injector.broadcastHeartbeats();
    assert.strictEqual(sent, 1);
    assert.strictEqual(sentFrames.length, 1);
    assert.strictEqual(sentFrames[0].type, 'heartbeat');
  });

  it('detects and reaps abandoned client connections beyond timeout window', () => {
    const injector = new GrpcHeartbeatInjectorService(5000, 10000);
    let closed = false;
    const client = {
      id: 'stream-dead',
      isOpen: true,
      lastAckTimestamp: 1000,
      sendFrame: () => {},
      close: (code, reason) => { closed = true; }
    };

    injector.registerStream(client);
    const reaped = injector.detectAndReapAbandonedConnections(12000); // 11000ms delta > 10000ms
    assert.deepStrictEqual(reaped, ['stream-dead']);
    assert.strictEqual(closed, true);
    assert.strictEqual(injector.getActiveStreamCount(), 0);
  });
});
