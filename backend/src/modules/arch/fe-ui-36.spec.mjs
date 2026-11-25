import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { VirtualizedTerminalEmulatorService } from './fe-ui-36.service.ts';

describe('VirtualizedTerminalEmulatorService (FE-UI-36)', () => {
  it('appends logs and trims to max capacity', () => {
    const term = new VirtualizedTerminalEmulatorService(5, 20);
    for (let i = 1; i <= 8; i++) {
      term.appendLog('Log line ' + i);
    }
    assert.strictEqual(term.getLineCount(), 5);
    const lines = term.searchLogs('Log line');
    assert.strictEqual(lines[0].raw, 'Log line 4');
    assert.strictEqual(lines[4].raw, 'Log line 8');
  });

  it('parses ANSI colors and bold tokens correctly', () => {
    const term = new VirtualizedTerminalEmulatorService();
    const tokens = term.parseAnsi('\x1b[31mError:\x1b[0m Normal');
    assert.strictEqual(tokens.length, 2);
    assert.strictEqual(tokens[0].text, 'Error:');
    assert.strictEqual(tokens[0].color, '#ef4444');
    assert.strictEqual(tokens[1].text, ' Normal');
    assert.strictEqual(tokens[1].color, undefined);
  });

  it('computes virtualized slice and padding for scrolling', () => {
    const term = new VirtualizedTerminalEmulatorService(1000, 20);
    for (let i = 0; i < 100; i++) {
      term.appendLog('Line ' + i);
    }
    const window = term.computeVirtualWindow(400, 200, 2);
    assert.ok(window.startIndex <= 20);
    assert.ok(window.endIndex >= 28);
    assert.strictEqual(window.visibleLines.length, window.endIndex - window.startIndex);
    assert.strictEqual(window.topPadding, window.startIndex * 20);
  });
});
