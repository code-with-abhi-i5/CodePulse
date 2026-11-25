import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MonacoMinimapDecorationService } from './fe-ui-46.service.ts';

describe('MonacoMinimapDecorationService (FE-UI-46)', () => {
  it('registers git diff indicators and diagnostic markers', () => {
    const service = new MonacoMinimapDecorationService();
    service.setGitDiffLine(10, 'ADDED');
    service.setDiagnosticLine(15, 'ERROR', 'Syntax error');

    const decs = service.getDecorationsForRange(5, 20);
    assert.strictEqual(decs.length, 2);
    assert.strictEqual(decs[0].color, '#22c55e');
    assert.strictEqual(decs[1].color, '#dc2626');
  });

  it('prioritizes diagnostic errors over git diff highlights on same line', () => {
    const service = new MonacoMinimapDecorationService();
    service.setGitDiffLine(12, 'MODIFIED');
    service.setDiagnosticLine(12, 'ERROR', 'Type mismatch');

    const decs = service.getDecorationsForRange(12, 12);
    assert.strictEqual(decs.length, 1);
    assert.strictEqual(decs[0].type, 'diagnostic');
  });
});
