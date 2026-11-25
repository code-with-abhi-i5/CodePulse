/**
 * Architecture Service: Optimistic UI State Reconciler
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-04]
 */

export interface OptimisticMutation<T> {
  id: string;
  previousState: T;
  optimisticState: T;
  appliedAt: number;
}

export class OptimisticUiStateReconcilerService<T> {
  private currentState: T;
  private pendingMutations: Map<string, OptimisticMutation<T>>;

  constructor(initialState: T) {
    this.currentState = JSON.parse(JSON.stringify(initialState));
    this.pendingMutations = new Map();
  }

  public applyOptimisticMutation(id: string, nextState: T): T {
    this.pendingMutations.set(id, {
      id,
      previousState: JSON.parse(JSON.stringify(this.currentState)),
      optimisticState: JSON.parse(JSON.stringify(nextState)),
      appliedAt: Date.now()
    });
    this.currentState = JSON.parse(JSON.stringify(nextState));
    return this.currentState;
  }

  public commitMutation(id: string): T {
    this.pendingMutations.delete(id);
    return this.currentState;
  }

  public rollbackMutation(id: string): T {
    const mutation = this.pendingMutations.get(id);
    if (!mutation) return this.currentState;
    this.currentState = mutation.previousState;
    this.pendingMutations.delete(id);
    return this.currentState;
  }

  public getState(): T {
    return this.currentState;
  }
}
