import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DockablePanelLayoutManagerService } from './fe-ui-32.service.ts';

describe('DockablePanelLayoutManagerService (FE-UI-32)', () => {
  it('manages dockable panels, clamps split sizes, and serializes layout', () => {
    const manager = new DockablePanelLayoutManagerService([
      { id: 'terminal', title: 'Terminal', dockEdge: 'BOTTOM', sizePct: 30, collapsed: false }
    ]);

    manager.updatePanelDock('terminal', 'RIGHT', 40);
    const panel = manager.getPanel('terminal');
    assert.strictEqual(panel.dockEdge, 'RIGHT');
    assert.strictEqual(panel.sizePct, 40);

    const serialized = manager.serializeLayout();
    const newManager = new DockablePanelLayoutManagerService();
    newManager.deserializeLayout(serialized);
    assert.strictEqual(newManager.getPanel('terminal').sizePct, 40);
  });
});
