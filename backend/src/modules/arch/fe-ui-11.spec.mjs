import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ComponentReRenderProfilerService } from './fe-ui-11.service.ts';

describe('ComponentReRenderProfilerService (FE-UI-11)', () => {
  it('tracks component re-renders, detects render bursts, and pinpoints mutated props', () => {
    const profiler = new ComponentReRenderProfilerService(3);

    const r1 = profiler.recordRender('CodeEditor', { code: 'a', line: 1 });
    assert.strictEqual(r1.isBurst, false);

    const r2 = profiler.recordRender('CodeEditor', { code: 'ab', line: 1 });
    assert.deepStrictEqual(r2.mutatedProps, ['code']);
    assert.strictEqual(r2.isBurst, false);

    const r3 = profiler.recordRender('CodeEditor', { code: 'ab', line: 2 });
    assert.strictEqual(r3.isBurst, true);
  });
});
