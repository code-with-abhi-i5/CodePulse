import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SemanticGitDiffViewerService } from './fe-ui-13.service.ts';

describe('SemanticGitDiffViewerService (FE-UI-13)', () => {
  it('computes structured line-by-line diffs with additions, deletions, and line numbers', () => {
    const viewer = new SemanticGitDiffViewerService();
    const oldCode = 'function main() {\n  return 1;\n}';
    const newCode = 'function main() {\n  return 2;\n}';

    const diff = viewer.computeLineDiff(oldCode, newCode);
    assert.strictEqual(diff.length, 4);

    assert.strictEqual(diff[0].type, 'UNCHANGED');
    assert.strictEqual(diff[1].type, 'DELETED');
    assert.strictEqual(diff[1].content, '  return 1;');
    assert.strictEqual(diff[2].type, 'ADDED');
    assert.strictEqual(diff[2].content, '  return 2;');
    assert.strictEqual(diff[3].type, 'UNCHANGED');
  });
});
