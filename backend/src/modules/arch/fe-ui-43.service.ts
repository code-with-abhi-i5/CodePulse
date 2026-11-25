/**
 * Architecture Service: Tournament Registration State Machine
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-43]
 */

export type TournamentState =
  | 'IDLE'
  | 'PROFILE_REVIEW'
  | 'TEAM_SELECTION'
  | 'BRACKET_CONFIRMATION'
  | 'PAYMENT_WAIVER'
  | 'COMPLETED'
  | 'FAILED';

export interface RegistrationContext {
  userId: string;
  profileValid: boolean;
  teamId?: string;
  waiverAccepted: boolean;
}

export class TournamentRegistrationStateMachine {
  private currentState: TournamentState;
  private history: TournamentState[];
  private context: RegistrationContext;

  constructor(userId: string) {
    this.currentState = 'IDLE';
    this.history = [];
    this.context = {
      userId,
      profileValid: false,
      waiverAccepted: false
    };
  }

  public getState(): TournamentState {
    return this.currentState;
  }

  public getContext(): RegistrationContext {
    return { ...this.context };
  }

  public start(): boolean {
    if (this.currentState !== 'IDLE') return false;
    this.transitionTo('PROFILE_REVIEW');
    return true;
  }

  public verifyProfile(valid: boolean): boolean {
    if (this.currentState !== 'PROFILE_REVIEW') return false;
    this.context.profileValid = valid;
    if (valid) {
      this.transitionTo('TEAM_SELECTION');
      return true;
    }
    this.transitionTo('FAILED');
    return false;
  }

  public selectTeam(teamId: string): boolean {
    if (this.currentState !== 'TEAM_SELECTION') return false;
    this.context.teamId = teamId;
    this.transitionTo('BRACKET_CONFIRMATION');
    return true;
  }

  public confirmBracket(): boolean {
    if (this.currentState !== 'BRACKET_CONFIRMATION') return false;
    this.transitionTo('PAYMENT_WAIVER');
    return true;
  }

  public signWaiver(accepted: boolean): boolean {
    if (this.currentState !== 'PAYMENT_WAIVER') return false;
    this.context.waiverAccepted = accepted;
    if (accepted) {
      this.transitionTo('COMPLETED');
      return true;
    }
    this.transitionTo('FAILED');
    return false;
  }

  public back(): boolean {
    if (this.history.length === 0 || this.currentState === 'COMPLETED') return false;
    this.currentState = this.history.pop()!;
    return true;
  }

  private transitionTo(newState: TournamentState): void {
    this.history.push(this.currentState);
    this.currentState = newState;
  }
}
