import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WebWorkerMarkdownCompilerService } from './fe-ui-44.service.ts';

describe('WebWorkerMarkdownCompilerService (FE-UI-44)', () => {
  it('compiles markdown headings and inline formatting', () => {
    const compiler = new WebWorkerMarkdownCompilerService();
    const md = '# Title\n**bold** and *italic*';
    const res = compiler.compile(md);
    assert.ok(res.html.includes('<h1>Title</h1>'));
    assert.ok(res.html.includes('<strong>bold</strong>'));
    assert.ok(res.html.includes('<em>italic</em>'));
  });

  it('identifies and marks math expressions', () => {
    const compiler = new WebWorkerMarkdownCompilerService();
    const md = 'Equation: $E = mc^2$';
    const res = compiler.compile(md);
    assert.strictEqual(res.hasMath, true);
    assert.ok(res.html.includes('<span class="katex-math">E = mc^2</span>'));
  });

  it('compiles code blocks and caches results', () => {
    const compiler = new WebWorkerMarkdownCompilerService();
    const code = String.fromCharCode(96).repeat(3) + 'ts\nconst x = 1;\n' + String.fromCharCode(96).repeat(3);
    const res1 = compiler.compile(code);
    assert.strictEqual(res1.codeBlocksCount, 1);
    assert.ok(res1.html.includes('<pre><code class="language-ts">'));

    const res2 = compiler.compile(code);
    assert.strictEqual(res1, res2);
  });
});
