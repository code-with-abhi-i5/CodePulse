import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CodeSnippetImageExportService } from './fe-ui-25.service.ts';

describe('CodeSnippetImageExportService (FE-UI-25)', () => {
  it('calculates high-resolution canvas dimensions and offsets for code snippet images', () => {
    const exporter = new CodeSnippetImageExportService({ padding: 30, lineHeight: 20 });
    const lines = ['const x = 10;', 'console.log(x);'];

    const layout = exporter.calculateLayout(lines);
    assert.ok(layout.width > 100);
    assert.strictEqual(layout.height, 2 * 20 + 30 + 30 * 2); // 2 lines * 20 + 30 header + 60 padding = 130
    assert.strictEqual(layout.codeOffsetY, 60);
  });
});
