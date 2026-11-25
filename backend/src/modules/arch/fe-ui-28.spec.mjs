import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AccessibleScreenReaderAnnouncerService } from './fe-ui-28.service.ts';

describe('AccessibleScreenReaderAnnouncerService (FE-UI-28)', () => {
  it('serializes screen reader announcements and prioritizes assertive messages', () => {
    const announcer = new AccessibleScreenReaderAnnouncerService();

    announcer.enqueue('Player 2 connected', 'polite');
    announcer.enqueue('Opponent submitted solution', 'polite');
    announcer.enqueue('Syntax Error on Line 10!', 'assertive'); // Priority

    // Assertive message must jump ahead of polite messages
    const next1 = announcer.popNext();
    assert.strictEqual(next1.message, 'Syntax Error on Line 10!');
    assert.strictEqual(next1.politeness, 'assertive');

    const next2 = announcer.popNext();
    assert.strictEqual(next2.message, 'Player 2 connected');
  });
});
