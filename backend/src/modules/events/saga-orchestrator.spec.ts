import { SagaOrchestratorService, SagaStatus } from './saga-orchestrator.service';
import { CompensationRunnerService, SagaStepDefinition } from './compensation-runner.service';

describe('Distributed Saga Execution Coordinator with Compensating Transactions (#1409)', () => {
  let compensationRunner: CompensationRunnerService;
  let orchestrator: SagaOrchestratorService;

  beforeEach(() => {
    compensationRunner = new CompensationRunnerService();
    orchestrator = new SagaOrchestratorService(compensationRunner);
  });

  describe('Happy Path: Sequential Multi-Service Workflow', () => {
    it('executes Contest Registration -> Escrow -> Compute -> Invite with full completion', async () => {
      interface ContestContext {
        userId: string;
        contestId: string;
        registered: boolean;
        escrowLocked: boolean;
        computeProvisioned: boolean;
        inviteSent: boolean;
      }

      const steps: SagaStepDefinition<ContestContext>[] = [
        {
          name: 'Contest Registration',
          forward: async (ctx) => {
            ctx.registered = true;
          },
          compensate: async (ctx) => {
            ctx.registered = false;
          },
        },
        {
          name: 'Payment Escrow',
          forward: async (ctx) => {
            ctx.escrowLocked = true;
          },
          compensate: async (ctx) => {
            ctx.escrowLocked = false;
          },
        },
        {
          name: 'Compute Allocation',
          forward: async (ctx) => {
            ctx.computeProvisioned = true;
          },
          compensate: async (ctx) => {
            ctx.computeProvisioned = false;
          },
        },
        {
          name: 'Team Invite',
          forward: async (ctx) => {
            ctx.inviteSent = true;
          },
          compensate: async (ctx) => {
            ctx.inviteSent = false;
          },
        },
      ];

      const initialContext: ContestContext = {
        userId: 'user-42',
        contestId: 'contest-grand-prix',
        registered: false,
        escrowLocked: false,
        computeProvisioned: false,
        inviteSent: false,
      };

      const result = await orchestrator.executeSaga(
        'ContestOnboardingSaga',
        steps,
        initialContext,
      );

      expect(result.status).toBe(SagaStatus.COMPLETED);
      expect(result.completedStepNames).toEqual([
        'Contest Registration',
        'Payment Escrow',
        'Compute Allocation',
        'Team Invite',
      ]);
      expect(result.context.registered).toBe(true);
      expect(result.context.escrowLocked).toBe(true);
      expect(result.context.computeProvisioned).toBe(true);
      expect(result.context.inviteSent).toBe(true);
      expect(result.totalDurationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Failure & Compensating Rollback Guarantees', () => {
    it('executes reverse compensation in LIFO order when Step 3 fails', async () => {
      const rollbackLog: string[] = [];

      interface FailureContext {
        step1Done: boolean;
        step2Done: boolean;
      }

      const steps: SagaStepDefinition<FailureContext>[] = [
        {
          name: 'Step 1: Reserve Slot',
          forward: async (ctx) => {
            ctx.step1Done = true;
          },
          compensate: async (ctx) => {
            rollbackLog.push('Rollback Step 1');
            ctx.step1Done = false;
          },
        },
        {
          name: 'Step 2: Lock Funds',
          forward: async (ctx) => {
            ctx.step2Done = true;
          },
          compensate: async (ctx) => {
            rollbackLog.push('Rollback Step 2');
            ctx.step2Done = false;
          },
        },
        {
          name: 'Step 3: Provision Kubernetes Pod',
          forward: async () => {
            throw new Error('Kubernetes node out of memory (OOMKilled)');
          },
          compensate: async () => {
            rollbackLog.push('Rollback Step 3');
          },
        },
      ];

      const result = await orchestrator.executeSaga(
        'FailingPodProvisionSaga',
        steps,
        { step1Done: false, step2Done: false },
      );

      expect(result.status).toBe(SagaStatus.COMPENSATED);
      expect(result.failureReason).toContain('OOMKilled');
      expect(result.completedStepNames).toEqual([
        'Step 1: Reserve Slot',
        'Step 2: Lock Funds',
      ]);

      // LIFO Check: Step 2 must be rolled back BEFORE Step 1!
      expect(rollbackLog).toEqual(['Rollback Step 2', 'Rollback Step 1']);
      expect(result.context.step1Done).toBe(false);
      expect(result.context.step2Done).toBe(false);
      expect(result.compensationResult?.allCompensated).toBe(true);
    });

    it('retries compensation with exponential backoff on transient failure', async () => {
      let attempts = 0;
      const steps: SagaStepDefinition<{ resourceCleaned: boolean }>[] = [
        {
          name: 'Step 1: External Resource',
          forward: async () => {},
          compensate: async (ctx) => {
            attempts++;
            if (attempts < 2) {
              throw new Error('Network timeout during refund');
            }
            ctx.resourceCleaned = true;
          },
        },
        {
          name: 'Step 2: Fatal Trigger',
          forward: async () => {
            throw new Error('Fatal condition');
          },
          compensate: async () => {},
        },
      ];

      const res = await orchestrator.executeSaga('RetryCompSaga', steps, {
        resourceCleaned: false,
      });

      expect(res.status).toBe(SagaStatus.COMPENSATED);
      expect(attempts).toBe(2);
      expect(res.context.resourceCleaned).toBe(true);
    });

    it('times out and triggers compensation if forward step exceeds timeout budget', async () => {
      const steps: SagaStepDefinition<{ step1: boolean }>[] = [
        {
          name: 'Step 1: Quick Prep',
          forward: async (ctx) => {
            ctx.step1 = true;
          },
          compensate: async (ctx) => {
            ctx.step1 = false;
          },
        },
        {
          name: 'Step 2: Stalling Step',
          timeoutMs: 50,
          forward: async () => {
            await new Promise((r) => setTimeout(r, 200)); // Stalls past 50ms timeout
          },
          compensate: async () => {},
        },
      ];

      const res = await orchestrator.executeSaga('TimeoutSaga', steps, {
        step1: false,
      });

      expect(res.status).toBe(SagaStatus.COMPENSATED);
      expect(res.failureReason).toContain('timed out');
      expect(res.context.step1).toBe(false);
    });
  });

  describe('SagaOrchestrator Telemetry & Tracking', () => {
    it('tracks initiated, completed, and compensated sagas correctly', async () => {
      const dummyStep: SagaStepDefinition<{ val: number }> = {
        name: 'Simple Step',
        forward: async (ctx) => {
          ctx.val += 1;
        },
        compensate: async (ctx) => {
          ctx.val -= 1;
        },
      };

      await orchestrator.executeSaga('SagaA', [dummyStep], { val: 0 });
      await orchestrator.executeSaga('SagaB', [dummyStep], { val: 0 });

      const telemetry = orchestrator.getTelemetry();
      expect(telemetry.totalSagasInitiated).toBe(2);
      expect(telemetry.sagasCompletedSuccessfully).toBe(2);
      expect(telemetry.sagasCompensatedSuccessfully).toBe(0);
      expect(telemetry.successRatePercentage).toBe(100);
    });
  });
});
