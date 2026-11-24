import { Injectable, Logger } from '@nestjs/common';

export interface SagaStepDefinition<TContext = Record<string, unknown>> {
  name: string;
  forward: (ctx: TContext) => Promise<void>;
  compensate: (ctx: TContext) => Promise<void>;
  timeoutMs?: number;
}

export interface CompensationLogEntry {
  stepName: string;
  attempt: number;
  success: boolean;
  durationMs: number;
  errorMessage?: string;
}

export interface CompensationResult {
  allCompensated: boolean;
  executedSteps: string[];
  logs: CompensationLogEntry[];
  totalDurationMs: number;
}

@Injectable()
export class CompensationRunnerService {
  private readonly logger = new Logger(CompensationRunnerService.name);

  /**
   * Executes compensation for completed steps in reverse order (LIFO).
   * Uses exponential backoff retries to guarantee eventual consistency.
   */
  public async executeCompensations<TContext = Record<string, unknown>>(
    completedSteps: SagaStepDefinition<TContext>[],
    context: TContext,
    maxRetries = 3,
  ): Promise<CompensationResult> {
    const startTime = performance.now();
    const logs: CompensationLogEntry[] = [];
    const executedSteps: string[] = [];
    let allCompensated = true;

    // LIFO: Reverse completed steps order
    const stepsToRollback = [...completedSteps].reverse();
    this.logger.warn(
      `Triggering reverse compensation sequence for ${stepsToRollback.length} completed steps: ` +
        stepsToRollback.map((s) => s.name).join(' -> '),
    );

    for (const step of stepsToRollback) {
      let stepSuccess = false;
      let lastError = '';

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const stepStart = performance.now();
        try {
          this.logger.log(`Executing compensation for step '${step.name}' (attempt ${attempt}/${maxRetries})...`);
          await step.compensate(context);
          stepSuccess = true;
          const duration = Math.round((performance.now() - stepStart) * 100) / 100;
          logs.push({ stepName: step.name, attempt, success: true, durationMs: duration });
          executedSteps.push(step.name);
          break;
        } catch (err) {
          lastError = (err as Error).message;
          const duration = Math.round((performance.now() - stepStart) * 100) / 100;
          logs.push({
            stepName: step.name,
            attempt,
            success: false,
            durationMs: duration,
            errorMessage: lastError,
          });
          this.logger.warn(`Compensation attempt ${attempt} for '${step.name}' failed: ${lastError}`);

          if (attempt < maxRetries) {
            const backoffMs = Math.pow(2, attempt) * 50;
            await new Promise((r) => setTimeout(r, backoffMs));
          }
        }
      }

      if (!stepSuccess) {
        allCompensated = false;
        this.logger.error(`Critical: Compensation for step '${step.name}' completely failed: ${lastError}`);
      }
    }

    const totalDuration = Math.round((performance.now() - startTime) * 100) / 100;
    return {
      allCompensated,
      executedSteps,
      logs,
      totalDurationMs: totalDuration,
    };
  }
}
