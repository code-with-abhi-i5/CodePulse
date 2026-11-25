import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MonacoVimEmulationService } from './fe-ui-38.service.ts';

describe('MonacoVimEmulationService (FE-UI-38)', () => {
  it('toggles vim modes via key commands and Escape', () => {
    const vim = new MonacoVimEmulationService();
    assert.strictEqual(vim.getMode(), 'NORMAL');

    vim.handleKeyPress('i');
    assert.strictEqual(vim.getMode(), 'INSERT');

    vim.handleKeyPress('Escape');
    assert.strictEqual(vim.getMode(), 'NORMAL');

    vim.handleKeyPress('v');
    assert.strictEqual(vim.getMode(), 'VISUAL');
  });

  it('records and replays macros across registers', () => {
    const vim = new MonacoVimEmulationService();
    vim.startRecordingMacro('a');
    vim.handleKeyPress('i');
    vim.handleKeyPress('Escape');
    vim.stopRecordingMacro();

    const played = vim.replayMacro('a');
    assert.deepStrictEqual(played, ['i', 'Escape']);
    assert.strictEqual(vim.getMode(), 'NORMAL');
  });

  it('stores and retrieves named registers', () => {
    const vim = new MonacoVimEmulationService();
    vim.setRegister('c', 'const result = true;');
    assert.strictEqual(vim.getRegister('c'), 'const result = true;');
    assert.strictEqual(vim.getRegister('z'), '');
  });
});
