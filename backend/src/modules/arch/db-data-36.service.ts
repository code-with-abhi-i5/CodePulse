/**
 * Architecture Service: Multi-Database Distributed Transaction Manager
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-36]
 */

export interface DistributedStep {
  name: string;
  execute: () => Promise<unknown>;
  compensate: () => Promise<void>;
}

export class MultiDatabaseTransactionManagerService {
  public async executeSaga(steps: DistributedStep[]): Promise<{
    success: boolean;
    executedSteps: string[];
    compensatedSteps: string[];
    error?: string;
  }> {
    const executedSteps: string[] = [];
    const compensatedSteps: string[] = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      try {
        await step.execute();
        executedSteps.push(step.name);
      } catch (err: any) {
        // Rollback executed steps in reverse order
        for (let j = executedSteps.length - 1; j >= 0; j--) {
          const compStep = steps[j];
          try {
            await compStep.compensate();
            compensatedSteps.push(compStep.name);
          } catch (compErr) {
            // Log compensation failure
          }
        }

        return {
          success: false,
          executedSteps,
          compensatedSteps,
          error: err.message
        };
      }
    }

    return {
      success: true,
      executedSteps,
      compensatedSteps: []
    };
  }
}
