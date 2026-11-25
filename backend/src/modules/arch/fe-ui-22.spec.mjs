import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MonacoIndentationFoldingProviderService } from './fe-ui-22.service.ts';

describe('MonacoIndentationFoldingProviderService (FE-UI-22)', () => {
  it('computes code folding ranges based on indentation hierarchy and block scopes', () => {
    const provider = new MonacoIndentationFoldingProviderService();
    const code = [
      'function test() {',
      '  const a = 1;',
      '  const b = 2;',
      '}'
    ];

    const ranges = provider.computeFoldingRanges(code);
    assert.strictEqual(ranges.length, 1);
    assert.strictEqual(ranges[0].startLine, 1);
    assert.strictEqual(ranges[0].endLine, 3);
  });
});
