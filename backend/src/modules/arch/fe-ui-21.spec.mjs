import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ModalFocusManagementCoordinatorService } from './fe-ui-21.service.ts';

describe('ModalFocusManagementCoordinatorService (FE-UI-21)', () => {
  it('traps focus inside modal dialog and returns focus to trigger element on close', () => {
    const coordinator = new ModalFocusManagementCoordinatorService();
    const initialFocus = coordinator.openModal('btn_open_settings', ['input_name', 'btn_save', 'btn_cancel']);

    assert.strictEqual(initialFocus, 'input_name');
    assert.strictEqual(coordinator.cycleTab(false), 'btn_save');
    assert.strictEqual(coordinator.cycleTab(false), 'btn_cancel');
    // Wrap around to start of modal
    assert.strictEqual(coordinator.cycleTab(false), 'input_name');

    // Close modal -> restores focus to trigger button
    assert.strictEqual(coordinator.closeModal(), 'btn_open_settings');
  });
});
