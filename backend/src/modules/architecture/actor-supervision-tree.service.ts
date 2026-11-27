export type SupervisionStrategy = 'ONE_FOR_ONE' | 'ALL_FOR_ONE';

export interface ActorNode {
  id: string;
  restartCount: number;
  state: 'RUNNING' | 'CRASHED' | 'RESTARTING';
}

export class ActorSupervisionTree {
  private actors = new Map<string, ActorNode>();
  private strategy: SupervisionStrategy;
  private maxRestarts: number;

  constructor(strategy: SupervisionStrategy = 'ONE_FOR_ONE', maxRestarts = 3) {
    this.strategy = strategy;
    this.maxRestarts = maxRestarts;
  }

  public registerActor(id: string): void {
    this.actors.set(id, { id, restartCount: 0, state: 'RUNNING' });
  }

  public handleCrash(crashedActorId: string): { action: 'RESTARTED' | 'ESCALATED'; affected: string[] } {
    const actor = this.actors.get(crashedActorId);
    if (!actor) throw new Error(`Actor ${crashedActorId} not found`);

    actor.state = 'CRASHED';
    actor.restartCount++;

    if (actor.restartCount > this.maxRestarts) {
      return { action: 'ESCALATED', affected: [crashedActorId] };
    }

    if (this.strategy === 'ONE_FOR_ONE') {
      actor.state = 'RUNNING';
      return { action: 'RESTARTED', affected: [crashedActorId] };
    } else {
      // ALL_FOR_ONE: restart all registered actors
      for (const a of this.actors.values()) {
        a.state = 'RUNNING';
      }
      return { action: 'RESTARTED', affected: Array.from(this.actors.keys()) };
    }
  }

  public getActorState(id: string): ActorNode | undefined {
    return this.actors.get(id);
  }
}
