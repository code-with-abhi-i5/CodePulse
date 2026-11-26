import { TutorState, TutorTransitionResult } from '../../types/ai';

export class CodingTutorStateMachine {
  private currentState: TutorState = 'GREETING';

  transition(action: 'SUBMIT_CODE' | 'REQUEST_HINT' | 'USER_REPLY' | 'SOLVE_CONFIRMED'): TutorTransitionResult {
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
      responseMessage: `State shifted to ${this.currentState}`,
      nextAllowedInputs: this.getAllowedInputs()
    };
  }

  private getAllowedInputs(): string[] {
    if (this.currentState === 'ANALYZING_CODE') return ['REQUEST_HINT'];
    if (this.currentState === 'GIVING_HINT') return ['USER_REPLY'];
    if (this.currentState === 'WAITING_FOR_USER') return ['SOLVE_CONFIRMED', 'REQUEST_HINT'];
    return ['SUBMIT_CODE'];
  }
}
