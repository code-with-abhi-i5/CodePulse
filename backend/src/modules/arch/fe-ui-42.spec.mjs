import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InlineGhostTextAutocompleteService } from './fe-ui-42.service.ts';

describe('InlineGhostTextAutocompleteService (FE-UI-42)', () => {
  it('manages ghost text matching and remaining completion', () => {
    const service = new InlineGhostTextAutocompleteService();
    service.setSuggestion(10, 5, 'console.log("hello world");', 'con');

    const ghost = service.getGhostText(10, 7, 'console');
    assert.strictEqual(ghost, '.log("hello world");');
  });

  it('accepts full suggestion and clears active state', () => {
    const service = new InlineGhostTextAutocompleteService();
    service.setSuggestion(1, 1, 'return true;', 'ret');
    const accepted = service.acceptFull();
    assert.strictEqual(accepted, 'return true;');
    assert.strictEqual(service.getGhostText(1, 1, 'ret'), null);
  });

  it('accepts word-by-word token', () => {
    const service = new InlineGhostTextAutocompleteService();
    service.setSuggestion(1, 1, 'const value = 42;', '');
    const token = service.acceptWord(0);
    assert.strictEqual(token, 'const');
  });
});
