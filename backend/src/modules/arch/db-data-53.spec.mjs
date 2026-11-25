import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ClickHouseMutationBackpressureService } from './db-data-53.service.ts';

describe('ClickHouseMutationBackpressureService (DB-DATA-53)', () => {
  it('throttles mutation submissions when system.mutations backlog is saturated', () => {
    const monitor = new ClickHouseMutationBackpressureService(5);

    assert.strictEqual(monitor.evaluateMutationSubmission(2).canSubmit, true);

    const saturated = monitor.evaluateMutationSubmission(6);
    assert.strictEqual(saturated.canSubmit, false);
    assert.ok(saturated.reason.includes('mutation queue saturated'));
  });
});
