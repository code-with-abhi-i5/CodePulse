import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MonacoSnippetExpansionEngineService } from './fe-ui-52.service.ts';

describe('MonacoSnippetExpansionEngineService (FE-UI-52)', () => {
  it('parses tabstops and placeholders from template', () => {
    const engine = new MonacoSnippetExpansionEngineService('for (let ${1:i} = 0; ${1:i} < ${2:len}; ${1:i}++) {\n  $0\n}');
    const tabstops = engine.getTabstops();
    assert.strictEqual(tabstops.length, 3);
    assert.strictEqual(tabstops[0].index, 1);
    assert.strictEqual(tabstops[0].placeholder, 'i');
    assert.strictEqual(tabstops[1].index, 2);
    assert.strictEqual(tabstops[1].placeholder, 'len');
    assert.strictEqual(tabstops[2].index, 0);
  });

  it('expands template with replacement inputs', () => {
    const engine = new MonacoSnippetExpansionEngineService('const ${1:name} = ${2:value};');
    const code = engine.expand({ 1: 'userId', 2: '"12345"' });
    assert.strictEqual(code, 'const userId = "12345";');
  });
});
