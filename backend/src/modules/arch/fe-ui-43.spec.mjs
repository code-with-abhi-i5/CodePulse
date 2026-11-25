import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TournamentRegistrationStateMachine } from './fe-ui-43.service.ts';

describe('TournamentRegistrationStateMachine (FE-UI-43)', () => {
  it('navigates through tournament registration flow to completion', () => {
    const sm = new TournamentRegistrationStateMachine('usr-100');
    assert.strictEqual(sm.getState(), 'IDLE');

    assert.ok(sm.start());
    assert.strictEqual(sm.getState(), 'PROFILE_REVIEW');

    assert.ok(sm.verifyProfile(true));
    assert.strictEqual(sm.getState(), 'TEAM_SELECTION');

    assert.ok(sm.selectTeam('team-alpha'));
    assert.strictEqual(sm.getState(), 'BRACKET_CONFIRMATION');

    assert.ok(sm.confirmBracket());
    assert.strictEqual(sm.getState(), 'PAYMENT_WAIVER');

    assert.ok(sm.signWaiver(true));
    assert.strictEqual(sm.getState(), 'COMPLETED');
  });

  it('handles step backtracking via history stack', () => {
    const sm = new TournamentRegistrationStateMachine('usr-101');
    sm.start();
    sm.verifyProfile(true);
    assert.strictEqual(sm.getState(), 'TEAM_SELECTION');

    assert.ok(sm.back());
    assert.strictEqual(sm.getState(), 'PROFILE_REVIEW');
  });
});
