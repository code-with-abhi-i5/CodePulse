import * as k8s from "@kubernetes/client-node";
import {
  ExecutionRunnerOperator,
  ExecutionRunnerPoolCustomResource,
  IKubernetesClientWrapper,
  DeepProbeResult,
} from "./runner-operator";

class MockKubernetesClient implements IKubernetesClientWrapper {
  public pods: Map<string, k8s.V1Pod> = new Map();
  public deletedPods: Array<{ name: string; gracePeriod: number }> = [];
  public createdPods: k8s.V1Pod[] = [];
  public updatedStatus: unknown = null;
  public probeResponses: Map<string, DeepProbeResult> = new Map();

  listPods(): Promise<k8s.V1PodList> {
    const podList: k8s.V1PodList = {
      apiVersion: "v1",
      kind: "PodList",
      metadata: {},
      items: Array.from(this.pods.values()),
    };
    return Promise.resolve(podList);
  }

  createPod(_namespace: string, pod: k8s.V1Pod): Promise<k8s.V1Pod> {
    const podName = pod.metadata?.name || "test-pod";
    this.pods.set(podName, pod);
    this.createdPods.push(pod);
    return Promise.resolve(pod);
  }

  deletePod(
    _namespace: string,
    podName: string,
    gracePeriodSeconds = 0,
  ): Promise<void> {
    this.pods.delete(podName);
    this.deletedPods.push({ name: podName, gracePeriod: gracePeriodSeconds });
    return Promise.resolve();
  }

  updateCustomResourceStatus(
    _group: string,
    _version: string,
    _namespace: string,
    _plural: string,
    _name: string,
    status: unknown,
  ): Promise<void> {
    this.updatedStatus = status;
    return Promise.resolve();
  }

  probePodHealth(podIp: string): Promise<DeepProbeResult> {
    if (this.probeResponses.has(podIp)) {
      return Promise.resolve(this.probeResponses.get(podIp)!);
    }
    return Promise.resolve({
      healthy: true,
      memoryUsageMb: 120,
      zombieProcesses: 0,
      activeExecutions: 0,
    });
  }
}

describe("ExecutionRunnerOperator", () => {
  let mockClient: MockKubernetesClient;
  let operator: ExecutionRunnerOperator;
  let poolCR: ExecutionRunnerPoolCustomResource;

  beforeEach(() => {
    mockClient = new MockKubernetesClient();
    operator = new ExecutionRunnerOperator(mockClient, "codepulse-runners");

    poolCR = {
      apiVersion: "codepulse.io/v1alpha1",
      kind: "ExecutionRunnerPool",
      metadata: {
        name: "tournament-runner-pool",
        namespace: "codepulse-runners",
      },
      spec: {
        warmPoolSize: 5,
        maxConcurrentBusy: 50,
        runnerImage: "ghcr.io/codepulse/execution-sandbox:latest",
        maxMemoryMb: 512,
        deepProbeIntervalSeconds: 2,
        deepProbePath: "/healthz/deep",
        recycleTimeoutSeconds: 5,
      },
    };
  });

  afterEach(() => {
    operator.stopReconciliationLoop();
  });

  describe("Warm Pool Provisioning & Reconciliation", () => {
    it("should provision warm pods up to warmPoolSize (5 pods) on cold start", async () => {
      const status = await operator.reconcile(poolCR);

      expect(status.warmPods).toBe(5);
      expect(status.busyPods).toBe(0);
      expect(status.phase).toBe("Ready");
      expect(mockClient.createdPods.length).toBe(5);

      // Verify each created pod manifest structure
      for (const pod of mockClient.createdPods) {
        expect(pod.metadata?.labels?.["codepulse.io/state"]).toBe("warm");
        expect(pod.spec?.terminationGracePeriodSeconds).toBe(0); // instant kill guarantee
        expect(pod.spec?.containers?.[0].image).toBe(
          "ghcr.io/codepulse/execution-sandbox:latest",
        );
      }
    });

    it("should maintain existing healthy warm and busy pods without unneeded pod creations", async () => {
      // Seed 3 warm pods and 2 busy pods
      for (let i = 0; i < 3; i++) {
        mockClient.pods.set(`warm-pod-${i}`, {
          metadata: {
            name: `warm-pod-${i}`,
            labels: { "codepulse.io/state": "warm" },
          },
          status: { phase: "Running", podIP: `10.244.0.1${i}` },
        });
      }
      for (let i = 0; i < 2; i++) {
        mockClient.pods.set(`busy-pod-${i}`, {
          metadata: {
            name: `busy-pod-${i}`,
            labels: { "codepulse.io/state": "busy" },
          },
          status: { phase: "Running", podIP: `10.244.0.2${i}` },
        });
      }

      // Pool needs 5 warm pods, currently has 3 -> should create only 2 more warm pods
      const status = await operator.reconcile(poolCR);

      expect(status.warmPods).toBe(5);
      expect(status.busyPods).toBe(2);
      expect(mockClient.createdPods.length).toBe(2);
    });
  });

  describe("Self-Healing: Poisoned & Degraded Runner Recycling (< 5s)", () => {
    it("should recycle pod instantly when native OOMKilled or CrashLoopBackOff is detected", async () => {
      // Seed 5 warm pods, one with terminated OOMKilled error
      for (let i = 0; i < 4; i++) {
        mockClient.pods.set(`warm-pod-${i}`, {
          metadata: {
            name: `warm-pod-${i}`,
            labels: { "codepulse.io/state": "warm" },
          },
          status: { phase: "Running", podIP: `10.244.0.1${i}` },
        });
      }
      mockClient.pods.set("crashed-pod-oom", {
        metadata: {
          name: "crashed-pod-oom",
          labels: { "codepulse.io/state": "warm" },
        },
        status: {
          phase: "Failed",
          containerStatuses: [
            {
              name: "execution-runner",
              image: "test",
              imageID: "test-id",
              ready: false,
              restartCount: 3,
              state: {
                terminated: {
                  exitCode: 137,
                  reason: "OOMKilled",
                },
              },
            },
          ],
        },
      });

      const status = await operator.reconcile(poolCR);

      expect(mockClient.deletedPods).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "crashed-pod-oom", gracePeriod: 0 }),
        ]),
      );
      expect(status.recycledPodsTotal).toBe(1);
      expect(status.lastRecycleDurationMs).toBeLessThan(5000); // < 5s SLA
      expect(status.warmPods).toBe(5); // warm pool replenished
    });

    it("should detect memory leak via /healthz/deep (> 512MB) and immediately recycle pod", async () => {
      // Setup 5 running warm pods
      for (let i = 0; i < 5; i++) {
        mockClient.pods.set(`warm-pod-${i}`, {
          metadata: {
            name: `warm-pod-${i}`,
            labels: { "codepulse.io/state": "warm" },
          },
          status: { phase: "Running", podIP: `10.244.0.1${i}` },
        });
      }

      // Configure deep probe on pod 2 to report 768MB memory (> 512MB maxMemoryMb)
      mockClient.probeResponses.set("10.244.0.12", {
        healthy: true,
        memoryUsageMb: 768,
        zombieProcesses: 0,
        activeExecutions: 1,
      });

      const status = await operator.reconcile(poolCR);

      expect(mockClient.deletedPods).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "warm-pod-2", gracePeriod: 0 }),
        ]),
      );
      expect(status.phase).toBe("Healing");
      expect(status.recycledPodsTotal).toBe(1);
      expect(status.warmPods).toBe(5);
    });

    it("should detect zombie process leak via /healthz/deep and trigger instant recycling", async () => {
      mockClient.pods.set("warm-pod-zombie", {
        metadata: {
          name: "warm-pod-zombie",
          labels: { "codepulse.io/state": "warm" },
        },
        status: { phase: "Running", podIP: "10.244.0.99" },
      });

      mockClient.probeResponses.set("10.244.0.99", {
        healthy: false,
        memoryUsageMb: 150,
        zombieProcesses: 4,
        activeExecutions: 0,
        reason: "Zombie processes detected: 4",
      });

      const status = await operator.reconcile(poolCR);

      expect(mockClient.deletedPods).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "warm-pod-zombie", gracePeriod: 0 }),
        ]),
      );
      expect(status.recycledPodsTotal).toBe(1);
    });
  });

  describe("Prometheus Metrics & Observability", () => {
    it("should export standard Prometheus metrics for Grafana dashboards", async () => {
      await operator.reconcile(poolCR);

      const metrics = operator.exportPrometheusMetrics();

      expect(metrics).toContain(
        'codepulse_runner_warm_pods{namespace="codepulse-runners"} 5',
      );
      expect(metrics).toContain(
        'codepulse_runner_busy_pods{namespace="codepulse-runners"} 0',
      );
      expect(metrics).toContain(
        'codepulse_runner_recycled_total{namespace="codepulse-runners"} 0',
      );
      expect(metrics).toContain(
        'codepulse_runner_last_recycle_duration_ms{namespace="codepulse-runners"}',
      );
      expect(metrics).toContain(
        'codepulse_runner_avg_recycle_duration_ms{namespace="codepulse-runners"}',
      );

      const poolMetrics = operator.getMetrics();
      expect(poolMetrics.warmPods).toBe(5);
      expect(poolMetrics.busyPods).toBe(0);
      expect(poolMetrics.recycledPodsTotal).toBe(0);
    });
  });
});
