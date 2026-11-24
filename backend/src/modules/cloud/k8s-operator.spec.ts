import { K8sOperatorService, CodeRunnerResource } from './k8s-operator.service';

describe('K8sOperatorService (#1422)', () => {
  let operator: K8sOperatorService;

  beforeEach(() => {
    operator = new K8sOperatorService();
  });

  afterEach(() => {
    operator.clear();
  });

  it('should reconcile CodeRunner CR and provision warm pod in under 500ms benchmark', async () => {
    const resource: CodeRunnerResource = {
      apiVersion: 'execution.codepulse.io/v1alpha1',
      kind: 'CodeRunner',
      metadata: {
        name: 'run-quick-sort',
        namespace: 'default',
      },
      spec: {
        language: 'python',
        code: 'print("sorted")',
        memoryLimit: '256Mi',
        cpuLimit: '500m',
      },
    };

    const reconciled = await operator.reconcile(resource);

    expect(reconciled.status?.phase).toBe('Running');
    expect(reconciled.status?.podName).toBeDefined();
    expect(reconciled.status?.podIp).toMatch(/^10\.244\.1\.\d+$/);

    // Verify sub-500ms provision benchmark
    expect(reconciled.status?.provisionDurationMs).toBeLessThan(500);

    const telemetry = operator.getTelemetry();
    expect(telemetry.totalReconciled).toBe(1);
    expect(telemetry.totalPodsProvisioned).toBe(1);
    expect(telemetry.averageProvisionDurationMs).toBeLessThan(500);
  });

  it('should recycle warm pod when execution completes cleanly', async () => {
    const resource: CodeRunnerResource = {
      apiVersion: 'execution.codepulse.io/v1alpha1',
      kind: 'CodeRunner',
      metadata: {
        name: 'run-test-success',
        namespace: 'default',
      },
      spec: {
        language: 'typescript',
        code: 'console.log("pass");',
      },
    };

    await operator.reconcile(resource);
    const completed = await operator.handlePodCompletion('default', 'run-test-success', false);

    expect(completed?.status?.phase).toBe('Completed');
    expect(completed?.status?.exitCode).toBe(0);
    expect(completed?.status?.cleanupStatus).toBe('Purged');
  });

  it('should clean up 100% of orphaned resources on pod crash', async () => {
    const resource: CodeRunnerResource = {
      apiVersion: 'execution.codepulse.io/v1alpha1',
      kind: 'CodeRunner',
      metadata: {
        name: 'run-crash-test',
        namespace: 'default',
      },
      spec: {
        language: 'rust',
        code: 'panic!("crash");',
      },
    };

    await operator.reconcile(resource);
    const failed = await operator.handlePodCompletion('default', 'run-crash-test', true);

    expect(failed?.status?.phase).toBe('Failed');
    expect(failed?.status?.exitCode).toBe(137); // OOM/crash
    expect(failed?.status?.cleanupStatus).toBe('OrphanCleaned');

    const telemetry = operator.getTelemetry();
    expect(telemetry.totalOrphanedPodsCleaned).toBe(1);
  });

  it('should support dynamic scaling for multiple languages without exhaustion', async () => {
    const languages: Array<'python' | 'go' | 'rust' | 'cpp'> = ['python', 'go', 'rust', 'cpp'];

    for (const lang of languages) {
      const res: CodeRunnerResource = {
        apiVersion: 'execution.codepulse.io/v1alpha1',
        kind: 'CodeRunner',
        metadata: {
          name: `runner-${lang}`,
          namespace: 'default',
        },
        spec: {
          language: lang,
          code: 'main()',
        },
      };

      const reconciled = await operator.reconcile(res);
      expect(reconciled.status?.phase).toBe('Running');
      expect(reconciled.status?.provisionDurationMs).toBeLessThan(500);
    }

    const telemetry = operator.getTelemetry();
    expect(telemetry.totalPodsProvisioned).toBe(4);
  });
});
