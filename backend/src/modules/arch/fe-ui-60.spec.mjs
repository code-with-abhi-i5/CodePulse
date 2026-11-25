import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BattleSpectatorSplitScreenService } from './fe-ui-60.service.ts';

describe('BattleSpectatorSplitScreenService (FE-UI-60)', () => {
  it('manages dual player code buffers and active typers', () => {
    const service = new BattleSpectatorSplitScreenService('p1', 'Alice', 'p2', 'Bob');
    assert.strictEqual(service.getLayoutMode(), 'HORIZONTAL');

    service.updatePlayerCode('p1', 'function solve() { return 1; }', 2, 1000);
    service.updatePlayerCode('p2', 'def solve(): return 2', 1, 2000);

    const s1 = service.getPlayerStream('p1');
    assert.strictEqual(s1?.code, 'function solve() { return 1; }');

    const s2 = service.getPlayerStream('p2');
    assert.strictEqual(s2?.code, 'def solve(): return 2');

    assert.strictEqual(service.getActiveTyper(), 'p2');
  });

  it('switches layout mode dynamically', () => {
    const service = new BattleSpectatorSplitScreenService('p1', 'A', 'p2', 'B');
    service.setLayoutMode('VERTICAL');
    assert.strictEqual(service.getLayoutMode(), 'VERTICAL');
  });
});
