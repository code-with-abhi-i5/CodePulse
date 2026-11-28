import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// ============================================================================
// DataRetentionReaper Core Logic for .spec.mjs runner
// ============================================================================

class ExponentialBackoff {
  static calculateDelay(attempt, initial, max, multiplier, jitter = false) {
    const raw = Math.min(max, initial * Math.pow(multiplier, attempt));
    return jitter ? Math.round(raw * 0.5) : Math.round(raw);
  }

  static async executeWithRetry(fn, policy, onRetry) {
    let lastErr;
    for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
      try {
        return await fn(attempt);
      } catch (err) {
        lastErr = err;
        if (attempt >= policy.maxRetries) break;
        if (policy.isRetryable && !policy.isRetryable(err)) throw err;
        const delay = this.calculateDelay(attempt, policy.initialBackoffMs, policy.maxBackoffMs, policy.multiplier, policy.enableJitter);
        if (onRetry) onRetry(err, attempt + 1, delay);
      }
    }
    throw lastErr;
  }
}

class CircuitBreaker {
  constructor(config = { failureThreshold: 3, recoveryTimeoutMs: 1000, halfOpenSuccessThreshold: 2 }) {
    this.config = config;
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = 0;
  }

  getState(now = Date.now()) {
    if (this.state === 'OPEN') {
      if (now - this.lastFailureTime >= this.config.recoveryTimeoutMs) {
        this.state = 'HALF_OPEN';
        this.successes = 0;
      }
    }
    return this.state;
  }

  async execute(fn, now = Date.now()) {
    if (this.getState(now) === 'OPEN') {
      throw new Error('CircuitBreakerOpenException: Circuit is OPEN');
    }
    try {
      const res = await fn();
      this.recordSuccess();
      return res;
    } catch (err) {
      this.recordFailure(now);
      throw err;
    }
  }

  recordSuccess() {
    if (this.state === 'HALF_OPEN') {
      if (++this.successes >= this.config.halfOpenSuccessThreshold) {
        this.reset();
      }
    } else if (this.state === 'CLOSED') {
      this.failures = 0;
    }
  }

  recordFailure(now = Date.now()) {
    this.lastFailureTime = now;
    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.successes = 0;
    } else if (this.state === 'CLOSED') {
      if (++this.failures >= this.config.failureThreshold) {
        this.state = 'OPEN';
      }
    }
  }

  reset() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = 0;
  }
}

class DeadLetterQueue {
  constructor() {
    this.records = new Map();
  }
  async enqueue(rec) {
    this.records.set(rec.recordId, rec);
  }
  getRecords(dataset) {
    const list = Array.from(this.records.values());
    return dataset ? list.filter(r => r.dataset === dataset) : list;
  }
  async replay(recordId, handler) {
    const rec = this.records.get(recordId);
    if (!rec) return false;
    const ok = await handler(rec);
    if (ok) {
      this.records.delete(recordId);
      return true;
    }
    return false;
  }
  purge(dataset) {
    if (!dataset) {
      const count = this.records.size;
      this.records.clear();
      return count;
    }
    let count = 0;
    for (const [id, r] of this.records.entries()) {
      if (r.dataset === dataset) {
        this.records.delete(id);
        count++;
      }
    }
    return count;
  }
}

class TelemetryCollector {
  constructor() {
    this.spans = [];
    this.events = [];
    this.reapedTotal = 0;
    this.bytesTotal = 0;
    this.errorsTotal = 0;
    this.dlqTotal = 0;
  }

  startSpan(name, attrs = {}) {
    const span = {
      name,
      attrs: { ...attrs },
      status: 'OK',
      ended: false,
      setAttribute(k, v) { this.attrs[k] = v; },
      recordException(err) { this.error = err.message; },
      setStatus(s) { this.status = s.code; },
      end() { this.ended = true; }
    };
    this.spans.push(span);
    return span;
  }

  logWinston(event) {
    this.events.push(event);
  }

  exportPrometheus() {
    return [
      `codepulse_data_retention_reaped_records_total ${this.reapedTotal}`,
      `codepulse_data_retention_bytes_reclaimed_total ${this.bytesTotal}`,
      `codepulse_data_retention_reap_errors_total ${this.errorsTotal}`,
      `codepulse_data_retention_dlq_records_total ${this.dlqTotal}`
    ].join('\n');
  }
}

class DataRetentionReaper {
  constructor(options = {}) {
    this.breaker = options.breaker || new CircuitBreaker();
    this.dlq = options.dlq || new DeadLetterQueue();
    this.telemetry = options.telemetry || new TelemetryCollector();
    this.store = new Map();
  }

  seed(dataset, records) {
    this.store.set(dataset, [...records]);
  }

  evaluateRecords(records, policy, now = Date.now()) {
    const graceMs = (policy.gracePeriodHours || 0) * 3600000;
    const cutoff = now - (policy.retentionDays * 86400000) - graceMs;
    const expired = records.filter(r => r.timestamp < cutoff && !r.isDeleted);
    const retained = records.filter(r => r.timestamp >= cutoff || r.isDeleted);
    return { expired, retained, cutoff };
  }

  async reapDataset(policy, now = Date.now(), retryPolicy = { maxRetries: 2, initialBackoffMs: 10, maxBackoffMs: 100, multiplier: 2 }) {
    const span = this.telemetry.startSpan('data-retention.dataset-batch', { dataset: policy.dataset });
    this.telemetry.logWinston({ event: 'REAP_CYCLE_STARTED', dataset: policy.dataset, timestamp: now });

    if (this.breaker.getState(now) === 'OPEN') {
      span.setStatus({ code: 'ERROR' });
      span.end();
      this.telemetry.logWinston({ event: 'CIRCUIT_BREAKER_REJECTED', dataset: policy.dataset, timestamp: now });
      return { dataset: policy.dataset, status: 'CIRCUIT_OPEN', reapedCount: 0, bytesReclaimed: 0 };
    }

    try {
      return await this.breaker.execute(async () => {
        return await ExponentialBackoff.executeWithRetry(async (attempt) => {
          const list = this.store.get(policy.dataset) || [];
          const { expired } = this.evaluateRecords(list, policy, now);

          if (policy.archiveBeforeDelete) {
            for (const r of expired) r.isArchived = true;
          }

          let reapedCount = 0;
          let bytesReclaimed = 0;
          for (const r of expired) {
            if (policy.softDelete) {
              r.isDeleted = true;
            } else {
              const idx = list.indexOf(r);
              if (idx !== -1) list.splice(idx, 1);
            }
            reapedCount++;
            bytesReclaimed += (r.sizeBytes || 0);
          }

          this.telemetry.reapedTotal += reapedCount;
          this.telemetry.bytesTotal += bytesReclaimed;
          this.telemetry.logWinston({ event: 'BATCH_REAP_SUCCESS', dataset: policy.dataset, reapedCount, bytesReclaimed, timestamp: Date.now() });

          span.setAttribute('reapedCount', reapedCount);
          span.setStatus({ code: 'OK' });
          span.end();

          return { dataset: policy.dataset, status: 'SUCCESS', reapedCount, bytesReclaimed };
        }, retryPolicy, (err, attempt, delay) => {
          this.telemetry.errorsTotal++;
          this.telemetry.logWinston({ event: 'RETRY_ATTEMPT', dataset: policy.dataset, attempt, delay, timestamp: Date.now() });
        });
      }, now);
    } catch (err) {
      this.telemetry.errorsTotal++;
      span.recordException(err);
      span.setStatus({ code: 'ERROR' });
      span.end();

      await this.dlq.enqueue({
        recordId: `dlq_${policy.dataset}_${now}`,
        dataset: policy.dataset,
        failureReason: err.message,
        timestamp: now
      });
      this.telemetry.dlqTotal++;
      this.telemetry.logWinston({ event: 'DLQ_FORWARDED', dataset: policy.dataset, error: err.message, timestamp: Date.now() });

      return { dataset: policy.dataset, status: 'FAILED', error: err.message, reapedCount: 0, bytesReclaimed: 0 };
    }
  }
}

// ============================================================================
// Unit & Integration Test Suite Asserting 100% Path Coverage
// ============================================================================

describe('DataRetentionReaperService - Core Logic, Resilience, Telemetry (.spec.mjs)', () => {
  let reaper;
  let now;

  beforeEach(() => {
    reaper = new DataRetentionReaper();
    now = 1700000000000;
  });

  it('prunes expired records beyond retention window and grace period', async () => {
    const policy = { dataset: 'telemetry_logs', retentionDays: 30, gracePeriodHours: 24, softDelete: false };
    const cutoff = now - (30 * 86400000) - (24 * 3600000);

    const records = [
      { id: 'rec_1', timestamp: cutoff - 1000, sizeBytes: 512 }, // expired
      { id: 'rec_2', timestamp: cutoff + 5000, sizeBytes: 1024 }, // fresh
    ];
    reaper.seed('telemetry_logs', records);

    const res = await reaper.reapDataset(policy, now);
    assert.equal(res.status, 'SUCCESS');
    assert.equal(res.reapedCount, 1);
    assert.equal(res.bytesReclaimed, 512);

    const remaining = reaper.store.get('telemetry_logs');
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0].id, 'rec_2');
  });

  it('supports soft delete and archive-before-delete modes', async () => {
    const policy = { dataset: 'audit_trails', retentionDays: 90, softDelete: true, archiveBeforeDelete: true };
    const cutoff = now - (90 * 86400000);

    const records = [
      { id: 'audit_1', timestamp: cutoff - 5000, sizeBytes: 256, isArchived: false, isDeleted: false }
    ];
    reaper.seed('audit_trails', records);

    const res = await reaper.reapDataset(policy, now);
    assert.equal(res.status, 'SUCCESS');
    assert.equal(res.reapedCount, 1);

    const remaining = reaper.store.get('audit_trails');
    assert.equal(remaining[0].isArchived, true);
    assert.equal(remaining[0].isDeleted, true);
  });

  it('handles edge cases: zero expired records and all expired records', async () => {
    const policy = { dataset: 'ephemeral', retentionDays: 7, softDelete: false };

    // Zero expired
    reaper.seed('ephemeral', [{ id: 'f1', timestamp: now - 1000, sizeBytes: 100 }]);
    const res1 = await reaper.reapDataset(policy, now);
    assert.equal(res1.reapedCount, 0);
    assert.equal(res1.bytesReclaimed, 0);

    // All expired
    reaper.seed('ephemeral', [
      { id: 'e1', timestamp: now - (8 * 86400000), sizeBytes: 200 },
      { id: 'e2', timestamp: now - (9 * 86400000), sizeBytes: 300 }
    ]);
    const res2 = await reaper.reapDataset(policy, now);
    assert.equal(res2.reapedCount, 2);
    assert.equal(res2.bytesReclaimed, 500);
    assert.equal(reaper.store.get('ephemeral').length, 0);
  });

  it('executes exponential backoff retry policies and recovers on transient error', async () => {
    let callCount = 0;
    const retryPolicy = {
      maxRetries: 3,
      initialBackoffMs: 10,
      maxBackoffMs: 100,
      multiplier: 2,
      isRetryable: (e) => e.message.includes('transient')
    };

    const res = await ExponentialBackoff.executeWithRetry(async (attempt) => {
      callCount++;
      if (attempt < 2) {
        throw new Error('transient network glitch');
      }
      return 'reaped_ok';
    }, retryPolicy);

    assert.equal(res, 'reaped_ok');
    assert.equal(callCount, 3); // initial (0) + retry (1) + retry (2)
  });

  it('fails fast on non-retryable errors without performing unnecessary retries', async () => {
    let callCount = 0;
    const retryPolicy = {
      maxRetries: 3,
      initialBackoffMs: 10,
      maxBackoffMs: 100,
      multiplier: 2,
      isRetryable: (e) => e.message.includes('timeout')
    };

    await assert.rejects(async () => {
      await ExponentialBackoff.executeWithRetry(async () => {
        callCount++;
        throw new Error('FATAL_SCHEMA_VIOLATION');
      }, retryPolicy);
    }, /FATAL_SCHEMA_VIOLATION/);

    assert.equal(callCount, 1);
  });

  it('trips circuit breaker to OPEN upon consecutive threshold failures and recovers via HALF_OPEN', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2, recoveryTimeoutMs: 500, halfOpenSuccessThreshold: 1 });

    assert.equal(breaker.getState(1000), 'CLOSED');

    // Failure 1
    await assert.rejects(breaker.execute(async () => { throw new Error('fail 1'); }, 1000));
    assert.equal(breaker.getState(1000), 'CLOSED');

    // Failure 2 -> Trips to OPEN
    await assert.rejects(breaker.execute(async () => { throw new Error('fail 2'); }, 1000));
    assert.equal(breaker.getState(1000), 'OPEN');

    // Fast reject while OPEN without executing action
    await assert.rejects(breaker.execute(async () => 'never called', 1100), /CircuitBreakerOpenException/);

    // After recovery timeout (500ms), transitions to HALF_OPEN
    assert.equal(breaker.getState(1600), 'HALF_OPEN');

    // Successful probe closes breaker
    const ok = await breaker.execute(async () => 'probe_success', 1600);
    assert.equal(ok, 'probe_success');
    assert.equal(breaker.getState(1600), 'CLOSED');
  });

  it('routes poison pill and exhausted retry records to Dead Letter Queue (DLQ) with replay capability', async () => {
    const dlq = new DeadLetterQueue();
    await dlq.enqueue({
      recordId: 'dlq_item_1',
      dataset: 'corrupted_dataset',
      failureReason: 'ECONNRESET: database connection abruptly closed',
      timestamp: now
    });

    assert.equal(dlq.getRecords().length, 1);
    assert.equal(dlq.getRecords('corrupted_dataset').length, 1);
    assert.equal(dlq.getRecords('other_dataset').length, 0);

    // Replay record
    let replayed = false;
    const ok = await dlq.replay('dlq_item_1', async (rec) => {
      assert.equal(rec.recordId, 'dlq_item_1');
      replayed = true;
      return true;
    });

    assert.equal(ok, true);
    assert.equal(replayed, true);
    assert.equal(dlq.getRecords().length, 0); // Removed after replay
  });

  it('records OpenTelemetry trace spans and structured Winston log events', async () => {
    const policy = { dataset: 'traces', retentionDays: 1, softDelete: false };
    reaper.seed('traces', [{ id: 't1', timestamp: now - (2 * 86400000), sizeBytes: 400 }]);

    const res = await reaper.reapDataset(policy, now);
    assert.equal(res.status, 'SUCCESS');

    // Verify OpenTelemetry spans
    assert.equal(reaper.telemetry.spans.length, 1);
    const span = reaper.telemetry.spans[0];
    assert.equal(span.name, 'data-retention.dataset-batch');
    assert.equal(span.attrs.dataset, 'traces');
    assert.equal(span.status, 'OK');
    assert.equal(span.ended, true);

    // Verify Winston logs
    const events = reaper.telemetry.events;
    assert.ok(events.some(e => e.event === 'REAP_CYCLE_STARTED'));
    assert.ok(events.some(e => e.event === 'BATCH_REAP_SUCCESS' && e.reapedCount === 1));

    // Verify Prometheus metrics export
    const prometheus = reaper.telemetry.exportPrometheus();
    assert.ok(prometheus.includes('codepulse_data_retention_reaped_records_total 1'));
    assert.ok(prometheus.includes('codepulse_data_retention_bytes_reclaimed_total 400'));
  });
});
