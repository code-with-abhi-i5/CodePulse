import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MonacoRegexSearchReplaceService } from './fe-ui-56.service.ts';

describe('MonacoRegexSearchReplaceService (FE-UI-56)', () => {
  it('finds regex matches and previews capture group replacements', () => {
    const service = new MonacoRegexSearchReplaceService();
    const text = 'const user_id = 42; const role_id = 10;';
    const matches = service.findMatches(text, '([a-z]+)_id', '$1Id');

    assert.strictEqual(matches.length, 2);
    assert.strictEqual(matches[0].matchText, 'user_id');
    assert.strictEqual(matches[0].previewReplacement, 'userId');
    assert.strictEqual(matches[1].matchText, 'role_id');
    assert.strictEqual(matches[1].previewReplacement, 'roleId');
  });

  it('performs replaceAll with capture substitutions', () => {
    const service = new MonacoRegexSearchReplaceService();
    const text = 'hello(world); test(code);';
    const replaced = service.replaceAll(text, '([a-z]+)\\(([a-z]+)\\)', '$2.$1()');
    assert.strictEqual(replaced, 'world.hello(); code.test();');
  });
});
