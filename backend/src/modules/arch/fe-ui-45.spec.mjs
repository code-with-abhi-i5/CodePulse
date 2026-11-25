import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WebSocketHeartbeatMeterService } from './fe-ui-45.service.ts';

describe('WebSocketHeartbeatMeterService (FE-UI-45)', () => {
  it('records ping-pong RTT and evaluates connection health', () => {
    const meter = new WebSocketHeartbeatMeterService();
    meter.emitPing(1000);
    const rtt = meter.recordPong(1030);
    assert.strictEqual(rtt, 30);
    assert.strictEqual(meter.getAverageLatency(), 30);
    assert.strictEqual(meter.getHealth(), 'EXCELLENT');
  });

  it('classifies poor health for high latency', () => {
    const meter = new WebSocketHeartbeatMeterService();
    meter.emitPing(1000);
    meter.recordPong(1250);
    assert.strictEqual(meter.getAverageLatency(), 250);
    assert.strictEqual(meter.getHealth(), 'POOR');
  });

  it('detects disconnects on consecutive missed pings', () => {
    const meter = new WebSocketHeartbeatMeterService(10, 3);
    meter.emitPing(1000);
    meter.emitPing(2000);
    meter.emitPing(3000);
    meter.emitPing(4000);
    assert.strictEqual(meter.getHealth(), 'DISCONNECTED');
    assert.ok(meter.getReconnectionBackoff() > 1000);
  });
});
