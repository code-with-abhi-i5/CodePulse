import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TcpSocketBacklogOptimizerService } from './perf-scale-06.service.ts';

describe('TcpSocketBacklogOptimizerService (PERF-SCALE-06)', () => {
  it('monitors TCP SYN backlog utilization and flags saturation', () => {
    const opt = new TcpSocketBacklogOptimizerService(100);
    for (let i = 0; i < 95; i++) {
      opt.recordIncomingSyn();
    }

    assert.strictEqual(opt.getUtilization(), 95);
    assert.strictEqual(opt.getHealth(), 'SATURATED');
    assert.strictEqual(opt.shouldShedTraffic(), true);
  });

  it('recovers to optimal health when connections are accepted', () => {
    const opt = new TcpSocketBacklogOptimizerService(100);
    for (let i = 0; i < 80; i++) {
      opt.recordIncomingSyn();
    }
    assert.strictEqual(opt.getHealth(), 'STRESSED');

    for (let i = 0; i < 50; i++) {
      opt.recordConnectionAccepted();
    }
    assert.strictEqual(opt.getHealth(), 'OPTIMAL');
  });
});
