import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MonacoZenModeConfigService } from './fe-ui-65.service.ts';

describe('MonacoZenModeConfigService (FE-UI-65)', () => {
  it('toggles zen mode and modifies editor view options', () => {
    const zen = new MonacoZenModeConfigService();
    const normalOpts = zen.getEditorOptions();
    assert.strictEqual(normalOpts.minimap.enabled, true);
    assert.strictEqual(normalOpts.lineNumbers, 'on');

    zen.toggleZenMode();
    const zenOpts = zen.getEditorOptions();
    assert.strictEqual(zenOpts.minimap.enabled, false);
    assert.strictEqual(zenOpts.lineNumbers, 'off');
    assert.strictEqual(zenOpts.fontSize, 16);
  });
});
