import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  CompensationRunnerService,
  SagaStepDefinition,
  CompensationResult,
} from './compensation-runner.service';

export enum SagaStatus {
  PENDING = 'PENDING',
  EXECUTING = 'EXECUTING',
  COMPLETED = 'COMPLETED',
  COMPENSATING = 'COMPENSATING',
  COMPENSATED = 'COMPENSATED',
  FAILED = 'FAILED',
}

export interface SagaExecutionRecord<TContext = Record<string, unknown>> {
  sagaId: string;
  sagaName: string;
  status: SagaStatus;
  currentStepIndex: number;
  completedStepNames: string[];
  context: TContext;
  startTime: number;
  endTime?: number;
  totalDurationMs?: number;
  failureReason?: string;
  compensationResult?: CompensationResult;
}

export interface SagaOrchestratorTelemetry {
  totalSagasInitiated: number;
  sagasCompletedSuccessfully: number;
  sagasCompensatedSuccessfully: number;
  sagasFailedUnrecoverably: number;
  activeSagasCount: number;
  successRatePercentage: number;
}

@Injectable()
export class SagaOrchestratorService {
  private readonly logger = new Logger(SagaOrchestratorService.name);
  private readonly sagaStore = new Map<string, SagaExecutionRecord>();

  private totalInitiated = 0;
  private totalCompleted = 0;
  private totalCompensated = 0;
  private totalFailed = 0;

  constructor(private readonly compensationRunner: CompensationRunnerService) {}

  /**
   * Executes a durable saga workflow with automatic reverse compensation on failure.
   */
  public async executeSaga<TContext = Record<string, unknown>>(
    sagaName: string,
    steps: SagaStepDefinition<TContext>[],
    initialContext: TContext,
  ): Promise<SagaExecutionRecord<TContext>> {
    const sagaId = crypto.randomUUID();
    const startTime = Date.now();
    this.totalInitiated++;

    const record: SagaExecutionRecord<TContext> = {
      sagaId,
      sagaName,
      status: SagaStatus.EXECUTING,
      currentStepIndex: 0,
      completedStepNames: [],
      context: { ...initialContext },
      startTime,
    };

    this.sagaStore.set(sagaId, record as SagaExecutionRecord);
    this.logger.log(`Starting Saga '${sagaName}' [${sagaId}] with ${steps.length} sequential steps`);

    const executedSteps: SagaStepDefinition<TContext>[] = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      record.currentStepIndex = i;

      try {
        this.logger.log(`[${sagaId}] Executing forward step '${step.name}' (${i + 1}/${steps.length})...`);

        // Timeout guard per step
        const timeoutMs = step.timeoutMs || 10000;
        await Promise.race([
          step.forward(record.context),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Step '${step.name}' timed out after ${timeoutMs}ms`)), timeoutMs),
          ),
        ]);

        executedSteps.push(step);
        record.completedStepNames.push(step.name);
      } catch (err) {
        const errorMsg = (err as Error).message;
        this.logger.error(`[${sagaId}] Step '${step.name}' failed: ${errorMsg}. Initiating compensating rollback.`);

        record.status = SagaStatus.COMPENSATING;
        record.failureReason = errorMsg;

        // Execute reverse compensation for all completed steps
        const compResult = await this.compensationRunner.executeCompensations(
          executedSteps,
          record.context,
        );

        record.compensationResult = compResult;
        record.endTime = Date.now();
        record.totalDurationMs = record.endTime - startTime;

        if (compResult.allCompensated) {
          record.status = SagaStatus.COMPENSATED;
          this.totalCompensated++;
          this.logger.warn(`[${sagaId}] Saga '${sagaName}' successfully compensated. Eventual consistency guaranteed.`);
        } else {
          record.status = SagaStatus.FAILED;
          this.totalFailed++;
          this.logger.error(`[${sagaId}] Saga '${sagaName}' compensation encountered partial failures.`);
        }

        return record;
      }
    }

    // All steps succeeded
    record.status = SagaStatus.COMPLETED;
    record.endTime = Date.now();
    record.totalDurationMs = record.endTime - startTime;
    this.totalCompleted++;

    this.logger.log(`[${sagaId}] Saga '${sagaName}' completed successfully in ${record.totalDurationMs}ms`);
    return record;
  }

  public getSaga(sagaId: string): SagaExecutionRecord | undefined {
    return this.sagaStore.get(sagaId);
  }

  public getTelemetry(): SagaOrchestratorTelemetry {
    let active = 0;
    for (const r of this.sagaStore.values()) {
      if (r.status === SagaStatus.EXECUTING || r.status === SagaStatus.COMPENSATING) {
        active++;
      }
    }

    const successRate =
      this.totalInitiated > 0 ? (this.totalCompleted / this.totalInitiated) * 100 : 100;

    return {
      totalSagasInitiated: this.totalInitiated,
      sagasCompletedSuccessfully: this.totalCompleted,
      sagasCompensatedSuccessfully: this.totalCompensated,
      sagasFailedUnrecoverably: this.totalFailed,
      activeSagasCount: active,
      successRatePercentage: Math.round(successRate * 10) / 10,
    };
  }
}
