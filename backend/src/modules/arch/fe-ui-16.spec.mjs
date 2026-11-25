import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ResponsiveIdeLayoutConstraintSolverService } from './fe-ui-16.service.ts';

describe('ResponsiveIdeLayoutConstraintSolverService (FE-UI-16)', () => {
  it('solves layout constraints for desktop multi-pane viewports and folds into single active tab on mobile', () => {
    const solver = new ResponsiveIdeLayoutConstraintSolverService(768);

    // Desktop viewport (1280px)
    const desktop = solver.solveLayout(1280);
    assert.strictEqual(desktop.isMobile, false);
    assert.strictEqual(desktop.paneVisibilities.editor, true);
    assert.strictEqual(desktop.paneVisibilities.fileTree, true);

    // Mobile viewport (375px)
    const mobile = solver.solveLayout(375, 'TERMINAL');
    assert.strictEqual(mobile.isMobile, true);
    assert.strictEqual(mobile.paneVisibilities.terminal, true);
    assert.strictEqual(mobile.paneVisibilities.editor, false);
  });
});
