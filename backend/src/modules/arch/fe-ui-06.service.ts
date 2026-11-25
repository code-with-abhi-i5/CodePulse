/**
 * Architecture Service: Offline Battle State Persistence Engine
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-06]
 */

export interface QueuedBattleAction {
  id: string;
  battleId: string;
  actionType: string;
  payload: any;
  timestamp: number;
  synced: boolean;
}

export class OfflineBattleStatePersistenceService {
  private queue: QueuedBattleAction[];

  constructor() {
    this.queue = [];
  }

  public enqueueAction(battleId: string, actionType: string, payload: any): QueuedBattleAction {
    const action: QueuedBattleAction = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      battleId,
      actionType,
      payload,
      timestamp: Date.now(),
      synced: false
    };
    this.queue.push(action);
    return action;
  }

  public getPendingActions(): QueuedBattleAction[] {
    return this.queue.filter(a => !a.synced);
  }

  public markSynced(actionIds: string[]): void {
    const idSet = new Set(actionIds);
    for (const a of this.queue) {
      if (idSet.has(a.id)) {
        a.synced = true;
      }
    }
  }

  public clearSynced(): void {
    this.queue = this.queue.filter(a => !a.synced);
  }
}
