export interface SagaStep {
  name: string;
  forward: () => Promise<any> | any;
  compensate: () => Promise<any> | any;
}

export type SagaState = 'STARTED' | 'COMPLETED' | 'COMPENSATED' | 'FAILED';

export class DistributedSagaOrchestrator {
  public async executeSaga(steps: SagaStep[]): Promise<{ state: SagaState; executedSteps: string[]; error?: string }> {
    const executed: SagaStep[] = [];

    // Forward execution
    for (const step of steps) {
      try {
        await step.forward();
        executed.push(step);
      } catch (err: any) {
        // Rollback executed steps in reverse order
        for (let i = executed.length - 1; i >= 0; i--) {
          try {
            await executed[i].compensate();
          } catch (compErr) {
            console.error('Compensation error:', compErr);
          }
        }
        return {
          state: 'COMPENSATED',
          executedSteps: executed.map(s => s.name),
          error: err?.message || String(err)
        };
      }
    }

    return {
      state: 'COMPLETED',
      executedSteps: executed.map(s => s.name)
    };
  }
}
