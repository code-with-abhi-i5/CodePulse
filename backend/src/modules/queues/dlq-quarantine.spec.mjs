import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class DlqQuarantineService {
  constructor() {
    this.quarantined = new Map();
    this.failureCounts = new Map();
  }

  calculateExponentialBackoff(attempt, baseMs = 1000, maxMs = 60000) {
    const raw = baseMs * Math.pow(2, attempt - 1);
    return Math.min(maxMs, raw);
  }

  processFailure(jobId, error, attempt, maxAttempts = 5) {
    if (attempt >= maxAttempts) {
      this.quarantineJob(jobId, error);
      return { action: 'quarantine', delayMs: 0 };
    }
    const delayMs = this.calculateExponentialBackoff(attempt);
    return { action: 'retry', delayMs };
  }

  quarantineJob(jobId, reason) {
    const record = { quarantinedAt: Date.now(), reason };
    this.quarantined.set(jobId, record);
    return { ...record, jobId };
  }

  tripCircuitBreaker(queueName, failureThreshold = 10) {
    const count = (this.failureCounts.get(queueName) || 0) + 1;
    this.failureCounts.set(queueName, count);
    return count >= failureThreshold;
  }
}

describe('DlqQuarantineService', () => {
  it('applies exponential backoff and safely quarantines poison pill jobs', () => {
    const service = new DlqQuarantineService();
    const step1 = service.processFailure('j1', 'timeout', 1);
    assert.equal(step1.action, 'retry');
    assert.equal(step1.delayMs, 1000);

    const step3 = service.processFailure('j1', 'timeout', 3);
    assert.equal(step3.action, 'retry');
    assert.equal(step3.delayMs, 4000);

    const stepMax = service.processFailure('j1', 'fatal crash', 5, 5);
    assert.equal(stepMax.action, 'quarantine');
    assert.ok(service.quarantined.has('j1'));
  });
});
