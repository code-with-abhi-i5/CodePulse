import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GrpcStreamingBackpressureService } from './api-int-51.service.ts';

describe('GrpcStreamingBackpressureService (API-INT-51)', () => {
  it('triggers flow control pauses at high watermark and resumes at low watermark', () => {
    const regulator = new GrpcStreamingBackpressureService(50, 10);

    const pauseCheck = regulator.evaluateQueueDepth(55);
    assert.strictEqual(pauseCheck.shouldPause, true);
    assert.strictEqual(regulator.getPausedStatus(), true);

    // Below high but above low -> remain paused
    const midCheck = regulator.evaluateQueueDepth(30);
    assert.strictEqual(midCheck.shouldResume, false);

    // Below low watermark -> resume
    const resumeCheck = regulator.evaluateQueueDepth(8);
    assert.strictEqual(resumeCheck.shouldResume, true);
    assert.strictEqual(regulator.getPausedStatus(), false);
  });
});
