import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CodeCoverageOverlayService } from './fe-ui-53.service.ts';

describe('CodeCoverageOverlayService (FE-UI-53)', () => {
  it('calculates aggregate code coverage percentage', () => {
    const overlay = new CodeCoverageOverlayService();
    overlay.setCoverage([
      { lineNumber: 1, hits: 5 },
      { lineNumber: 2, hits: 0 },
      { lineNumber: 3, hits: 2 },
      { lineNumber: 4, hits: 0 }
    ]);

    assert.strictEqual(overlay.getCoveragePercentage(), 50);
    assert.deepStrictEqual(overlay.getUncoveredLines(), [2, 4]);
  });

  it('assigns gutter decoration classes for covered vs uncovered lines', () => {
    const overlay = new CodeCoverageOverlayService();
    overlay.setCoverage([
      { lineNumber: 1, hits: 1 },
      { lineNumber: 2, hits: 0 }
    ]);

    assert.strictEqual(overlay.getGutterClass(1), 'coverage-hit');
    assert.strictEqual(overlay.getGutterClass(2), 'coverage-miss');
    assert.strictEqual(overlay.getGutterClass(99), 'coverage-neutral');
  });
});
