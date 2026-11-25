import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { QuickCommandPaletteService } from './fe-ui-50.service.ts';

describe('QuickCommandPaletteService (FE-UI-50)', () => {
  it('registers and searches commands by title and keywords', () => {
    const palette = new QuickCommandPaletteService();
    palette.registerCommand({ id: 'nav-tour', title: 'Open Tournament', category: 'Navigation', keywords: ['battle', 'compete'] });
    palette.registerCommand({ id: 'set-theme', title: 'Toggle Theme', category: 'Settings' });

    const results = palette.search('tournament');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].id, 'nav-tour');

    const kwResults = palette.search('compete');
    assert.strictEqual(kwResults.length, 1);
  });

  it('tracks recently executed commands on empty query', () => {
    const palette = new QuickCommandPaletteService();
    palette.registerCommand({ id: 'c1', title: 'Command 1', category: 'General' });
    palette.registerCommand({ id: 'c2', title: 'Command 2', category: 'General' });

    palette.executeCommand('c2');
    const recents = palette.search('');
    assert.strictEqual(recents.length, 1);
    assert.strictEqual(recents[0].id, 'c2');
  });
});
