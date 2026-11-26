import test from 'node:test';
import assert from 'node:assert/strict';

class CodingTutorStateMachine {
  constructor() {
    this.currentState = 'GREETING';
  }

  transition(action) {
    const previousState = this.currentState;

    switch (this.currentState) {
      case 'GREETING':
        if (action === 'SUBMIT_CODE') this.currentState = 'ANALYZING_CODE';
        break;
      case 'ANALYZING_CODE':
        if (action === 'REQUEST_HINT') this.currentState = 'GIVING_HINT';
        break;
      case 'GIVING_HINT':
        if (action === 'USER_REPLY') this.currentState = 'WAITING_FOR_USER';
        break;
      case 'WAITING_FOR_USER':
        if (action === 'SOLVE_CONFIRMED') this.currentState = 'SUCCESS_CONCLUDED';
        else if (action === 'REQUEST_HINT') this.currentState = 'GIVING_HINT';
        break;
      default:
        break;
    }

    return {
      previousState,
      currentState: this.currentState,
      responseMessage: `State shifted to ${this.currentState}`
    };
  }
}

test('CodingTutorStateMachine - governs multi-turn conversational tutoring transitions', () => {
  const machine = new CodingTutorStateMachine();
  const step1 = machine.transition('SUBMIT_CODE');
  assert.strictEqual(step1.currentState, 'ANALYZING_CODE');

  const step2 = machine.transition('REQUEST_HINT');
  assert.strictEqual(step2.currentState, 'GIVING_HINT');

  const step3 = machine.transition('USER_REPLY');
  assert.strictEqual(step3.currentState, 'WAITING_FOR_USER');

  const step4 = machine.transition('SOLVE_CONFIRMED');
  assert.strictEqual(step4.currentState, 'SUCCESS_CONCLUDED');
});
