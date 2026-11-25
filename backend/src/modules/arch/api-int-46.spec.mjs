import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GrpcConnectivityStateMonitorService } from './api-int-46.service.ts';

describe('GrpcConnectivityStateMonitorService (API-INT-46)', () => {
  it('monitors channel state transitions and triggers alert on transient failures', () => {
    const monitor = new GrpcConnectivityStateMonitorService();
    const id = 'judge-cluster';

    assert.strictEqual(monitor.updateState(id, 'READY').alertRequired, false);
    const drop = monitor.updateState(id, 'TRANSIENT_FAILURE');
    assert.strictEqual(drop.stateChanged, true);
    assert.strictEqual(drop.alertRequired, true);
  });
});
