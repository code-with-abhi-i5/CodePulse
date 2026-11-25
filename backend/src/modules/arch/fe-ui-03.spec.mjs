import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OffMainThreadSyntaxHighlighterService } from './fe-ui-03.service.ts';

describe('OffMainThreadSyntaxHighlighterService (FE-UI-03)', () => {
  it('tokenizes JavaScript/TypeScript code into keywords, strings, numbers, and comments', () => {
    const highlighter = new OffMainThreadSyntaxHighlighterService();
    const source = 'const maxScore = 100; // top score\nreturn "Winner";';

    const tokens = highlighter.tokenizeSource(source);
    assert.ok(tokens.length >= 6);

    const types = tokens.map(t => t.type);
    assert.ok(types.includes('KEYWORD'));
    assert.ok(types.includes('IDENTIFIER'));
    assert.ok(types.includes('NUMBER'));
    assert.ok(types.includes('COMMENT'));
    assert.ok(types.includes('STRING'));
  });
});
