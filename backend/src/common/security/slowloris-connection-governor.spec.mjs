import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class SlowlorisConnectionGovernorService {
  constructor(minTransferRateBytesPerSec = 100, maxIdleDurationMs = 10000) {
    this.minTransferRateBytesPerSec = minTransferRateBytesPerSec;
    this.maxIdleDurationMs = maxIdleDurationMs;
  }

  evaluateSocket(socketId, bytesReceived, durationMs) {
    const seconds = Math.max(durationMs / 1000, 0.001);
    const transferRateBytesPerSec = Math.floor(bytesReceived / seconds);

    if (durationMs >= this.maxIdleDurationMs && transferRateBytesPerSec < this.minTransferRateBytesPerSec) {
      return {
        socketId,
        shouldTerminate: true,
        bytesReceived,
        durationMs,
        transferRateBytesPerSec,
        reason: 'Slowloris attack mitigation: Transfer rate ' + transferRateBytesPerSec + ' B/s below threshold ' + this.minTransferRateBytesPerSec + ' B/s after ' + durationMs + 'ms'
      };
    }

    return {
      socketId,
      shouldTerminate: false,
      bytesReceived,
      durationMs,
      transferRateBytesPerSec
    };
  }
}

describe('SlowlorisConnectionGovernorService', () => {
  const governor = new SlowlorisConnectionGovernorService(100, 10000);

  it('allows fast streaming connections', () => {
    const status = governor.evaluateSocket('sock-1', 50000, 5000);
    assert.equal(status.shouldTerminate, false);
    assert.ok(status.transferRateBytesPerSec > 100);
  });

  it('terminates lingering low-throughput slowloris sockets', () => {
    const status = governor.evaluateSocket('sock-slowloris', 50, 12000);
    assert.equal(status.shouldTerminate, true);
    assert.ok(status.reason.includes('Slowloris attack mitigation'));
  });
});
