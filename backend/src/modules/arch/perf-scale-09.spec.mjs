import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { V8GcPauseTimeDampenerService } from './perf-scale-09.service.ts';

describe('V8GcPauseTimeDampenerService (PERF-SCALE-09)', () => {
  it('tracks GC events and detects pause threshold violations', () => {
    const dampener = new V8GcPauseTimeDampenerService(10);
    dampener.recordGcEvent('minor', 2);
    dampener.recordGcEvent('major', 15); // > 10ms

    assert.strictEqual(dampener.isViolatingPauseThreshold(), true);
    assert.strictEqual(dampener.getAverageMajorPauseMs(), 15);
  });

  it('confirms healthy pause times under 10ms', () => {
    const dampener = new V8GcPauseTimeDampenerService(10);
    dampener.recordGcEvent('minor', 1);
    dampener.recordGcEvent('major', 6);

    assert.strictEqual(dampener.isViolatingPauseThreshold(), false);
    assert.strictEqual(dampener.getAverageMajorPauseMs(), 6);
  });
});
