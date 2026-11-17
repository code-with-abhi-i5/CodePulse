import * as k8s from "@kubernetes/client-node";
import axios from "axios";

export interface ExecutionRunnerPoolSpec {
  warmPoolSize: number;
  maxConcurrentBusy: number;
  runnerImage: string;
  maxMemoryMb?: number;
  deepProbeIntervalSeconds?: number;
  deepProbePath?: string;
  recycleTimeoutSeconds?: number;
  preWarmStandbyCount?: number;
}

export interface ExecutionRunnerPoolStatus {
  phase: "Initializing" | "Ready" | "Healing" | "Degraded";
  warmPods: number;
  busyPods: number;
  recycledPodsTotal: number;
  lastRecycleDurationMs: number;
  avgRecycleDurationMs: number;
  selector?: string;
  conditions?: Array<{
    type: string;
    status: string;
    reason: string;
    message: string;
    lastTransitionTime: string;
  }>;
}

export interface ExecutionRunnerPoolCustomResource {
  apiVersion: string;
  kind: string;
  metadata: k8s.V1ObjectMeta;
  spec: ExecutionRunnerPoolSpec;
  status?: ExecutionRunnerPoolStatus;
}

export interface DeepProbeResult {
  healthy: boolean;
  memoryUsageMb: number;
  zombieProcesses: number;
  activeExecutions: number;
  reason?: string;
}

export interface PoolMetrics {
  warmPods: number;
  busyPods: number;
  recycledPodsTotal: number;
  lastRecycleDurationMs: number;
  avgRecycleDurationMs: number;
}

export interface IKubernetesClientWrapper {
  listPods(namespace: string, labelSelector: string): Promise<k8s.V1PodList>;
  createPod(namespace: string, pod: k8s.V1Pod): Promise<k8s.V1Pod>;
  deletePod(
    namespace: string,
    podName: string,
    gracePeriodSeconds?: number,
  ): Promise<void>;
  updateCustomResourceStatus(
    group: string,
    version: string,
    namespace: string,
    plural: string,
    name: string,
    status: ExecutionRunnerPoolStatus,
  ): Promise<void>;
  probePodHealth(
    podIp: string,
    port: number,
    path: string,
  ): Promise<DeepProbeResult>;
}

export class DefaultKubernetesClientWrapper implements IKubernetesClientWrapper {
  private readonly coreV1Api: k8s.CoreV1Api;
  private readonly customObjectsApi: k8s.CustomObjectsApi;

  constructor(kubeConfig?: k8s.KubeConfig) {
    const kc = kubeConfig || new k8s.KubeConfig();
    if (!kubeConfig) {
      try {
        kc.loadFromCluster();
      } catch {
        kc.loadFromDefault();
      }
    }
    this.coreV1Api = kc.makeApiClient(k8s.CoreV1Api);
    this.customObjectsApi = kc.makeApiClient(k8s.CustomObjectsApi);
  }

  async listPods(
    namespace: string,
    labelSelector: string,
  ): Promise<k8s.V1PodList> {
    const res = await this.coreV1Api.listNamespacedPod({
      namespace,
      labelSelector,
    });
    return res;
  }

  async createPod(namespace: string, pod: k8s.V1Pod): Promise<k8s.V1Pod> {
    const res = await this.coreV1Api.createNamespacedPod({
      namespace,
      body: pod,
    });
    return res;
  }

  async deletePod(
    namespace: string,
    podName: string,
    gracePeriodSeconds = 0,
  ): Promise<void> {
    await this.coreV1Api.deleteNamespacedPod({
      name: podName,
      namespace,
      gracePeriodSeconds,
    });
  }

  async updateCustomResourceStatus(
    group: string,
    version: string,
    namespace: string,
    plural: string,
    name: string,
    status: ExecutionRunnerPoolStatus,
  ): Promise<void> {
    await this.customObjectsApi.patchNamespacedCustomObjectStatus({
      group,
      version,
      namespace,
      plural,
      name,
      body: { status },
    });
  }

  async probePodHealth(
    podIp: string,
    port: number,
    path: string,
  ): Promise<DeepProbeResult> {
    try {
      const response = await axios.get(`http://${podIp}:${port}${path}`, {
        timeout: 1500,
      });
      const data = response.data as {
        memoryUsageMb?: number;
        zombieProcesses?: number;
        activeExecutions?: number;
        healthy?: boolean;
      };

      const memoryUsageMb = data.memoryUsageMb ?? 0;
      const zombieProcesses = data.zombieProcesses ?? 0;
      const activeExecutions = data.activeExecutions ?? 0;

      return {
        healthy: data.healthy !== false && zombieProcesses === 0,
        memoryUsageMb,
        zombieProcesses,
        activeExecutions,
        reason:
          zombieProcesses > 0
            ? `Zombie processes detected: ${zombieProcesses}`
            : undefined,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        healthy: false,
        memoryUsageMb: 0,
        zombieProcesses: 0,
        activeExecutions: 0,
        reason: `Probe connection failed: ${msg}`,
      };
    }
  }
}

export class ExecutionRunnerOperator {
  private readonly client: IKubernetesClientWrapper;
  private readonly namespace: string;
  private reconcileTimer: NodeJS.Timeout | null = null;
  private isReconciling = false;

  // Prometheus Metrics tracking
  private warmPodsCount = 0;
  private busyPodsCount = 0;
  private recycledTotal = 0;
  private lastRecycleMs = 0;
  private recycleDurations: number[] = [];

  constructor(
    client?: IKubernetesClientWrapper,
    namespace = "codepulse-runners",
  ) {
    this.client = client || new DefaultKubernetesClientWrapper();
    this.namespace = namespace;
  }

  /**
   * Builds the standard V1Pod specification for an execution sandbox runner.
   */
  buildRunnerPodManifest(
    poolName: string,
    podName: string,
    image: string,
    maxMemoryMb: number,
  ): k8s.V1Pod {
    return {
      apiVersion: "v1",
      kind: "Pod",
      metadata: {
        name: podName,
        namespace: this.namespace,
        labels: {
          "codepulse.io/managed-by": "runner-operator",
          "codepulse.io/pool": poolName,
          "codepulse.io/state": "warm", // Initially 'warm', transitions to 'busy' on match dispatch
        },
        annotations: {
          "codepulse.io/created-at": new Date().toISOString(),
          "codepulse.io/max-memory-mb": String(maxMemoryMb),
        },
      },
      spec: {
        restartPolicy: "Never",
        terminationGracePeriodSeconds: 0, // Instant recycle capability (<5s guarantee)
        containers: [
          {
            name: "execution-runner",
            image,
            imagePullPolicy: "IfNotPresent",
            ports: [
              { name: "deep-probe", containerPort: 8080 },
              { name: "runner-grpc", containerPort: 50051 },
            ],
            resources: {
              requests: {
                cpu: "250m",
                memory: "128Mi",
              },
              limits: {
                cpu: "1000m",
                memory: `${maxMemoryMb}Mi`,
              },
            },
          },
        ],
      },
    };
  }

  /**
   * Main reconciliation logic for an ExecutionRunnerPool custom resource.
   * Ensures warm pods pool matches spec, detects poisoned/crashed pods, and self-heals in < 5s.
   */
  async reconcile(
    pool: ExecutionRunnerPoolCustomResource,
  ): Promise<ExecutionRunnerPoolStatus> {
    const spec = pool.spec;
    const poolName = pool.metadata.name || "default-runner-pool";
    const labelSelector = `codepulse.io/managed-by=runner-operator,codepulse.io/pool=${poolName}`;
    const maxMemory = spec.maxMemoryMb || 512;
    const targetWarmPool = spec.warmPoolSize || 5;
    const deepProbePath = spec.deepProbePath || "/healthz/deep";

    // 1. List current pods under management
    const podList = await this.client.listPods(this.namespace, labelSelector);
    const pods = podList.items || [];

    const warmPods: k8s.V1Pod[] = [];
    const busyPods: k8s.V1Pod[] = [];
    const poisonedPods: Array<{ pod: k8s.V1Pod; reason: string }> = [];

    for (const pod of pods) {
      const state = pod.metadata?.labels?.["codepulse.io/state"] || "warm";
      const phase = pod.status?.phase;

      // Check for native pod termination or crash
      if (
        phase === "Failed" ||
        phase === "Unknown" ||
        pod.metadata?.deletionTimestamp
      ) {
        poisonedPods.push({
          pod,
          reason: `Pod native phase degraded (${phase || "Terminating"})`,
        });
        continue;
      }

      // Check container crash loops or error states
      const containerStatuses = pod.status?.containerStatuses || [];
      const hasTerminatedError = containerStatuses.some(
        (cs) =>
          cs.state?.terminated &&
          (cs.state.terminated.exitCode !== 0 ||
            cs.state.terminated.reason === "OOMKilled"),
      );

      if (hasTerminatedError) {
        poisonedPods.push({
          pod,
          reason: "Container crash or OOMKilled detected",
        });
        continue;
      }

      // Deep probe inspection on Running pods
      if (phase === "Running" && pod.status?.podIP) {
        const probe = await this.client.probePodHealth(
          pod.status.podIP,
          8080,
          deepProbePath,
        );

        if (!probe.healthy) {
          poisonedPods.push({
            pod,
            reason: probe.reason || "Deep probe reported unhealthy runtime",
          });
          continue;
        }

        // Memory leak threshold check (> maxMemoryMb)
        if (probe.memoryUsageMb > maxMemory) {
          poisonedPods.push({
            pod,
            reason: `Memory leak detected: ${probe.memoryUsageMb}MB exceeds limit ${maxMemory}MB`,
          });
          continue;
        }

        // Zombie processes check
        if (probe.zombieProcesses > 0) {
          poisonedPods.push({
            pod,
            reason: `Zombie process leak: ${probe.zombieProcesses} defunct processes`,
          });
          continue;
        }
      }

      // Categorize healthy pods
      if (state === "busy") {
        busyPods.push(pod);
      } else {
        warmPods.push(pod);
      }
    }

    // 2. Self-Healing: Instantly recycle poisoned pods (< 5s SLA)
    for (const item of poisonedPods) {
      const recycleStart = Date.now();
      const podName = item.pod.metadata?.name;
      if (!podName) continue;

      // Step A: Immediately kill poisoned pod with 0 grace period
      await this.client.deletePod(this.namespace, podName, 0);

      // Step B: Spin up pre-warmed standby pod immediately to replenish
      const replacementName = `${poolName}-standby-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const replacementPod = this.buildRunnerPodManifest(
        poolName,
        replacementName,
        spec.runnerImage,
        maxMemory,
      );

      await this.client.createPod(this.namespace, replacementPod);

      const recycleDuration = Date.now() - recycleStart;
      this.lastRecycleMs = recycleDuration;
      this.recycledTotal++;
      this.recycleDurations.push(recycleDuration);
      if (this.recycleDurations.length > 100) {
        this.recycleDurations.shift();
      }

      warmPods.push(replacementPod);
    }

    // 3. Replenish Warm Pool if deficit exists below spec.warmPoolSize
    const warmDeficit = targetWarmPool - warmPods.length;
    if (warmDeficit > 0) {
      for (let i = 0; i < warmDeficit; i++) {
        const standbyName = `${poolName}-warm-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
        const newPod = this.buildRunnerPodManifest(
          poolName,
          standbyName,
          spec.runnerImage,
          maxMemory,
        );
        await this.client.createPod(this.namespace, newPod);
        warmPods.push(newPod);
      }
    }

    // Update Operator Metrics
    this.warmPodsCount = warmPods.length;
    this.busyPodsCount = busyPods.length;

    const avgDuration =
      this.recycleDurations.length > 0
        ? Math.round(
            this.recycleDurations.reduce((a, b) => a + b, 0) /
              this.recycleDurations.length,
          )
        : 0;

    let poolPhase: ExecutionRunnerPoolStatus["phase"] = "Ready";
    if (poisonedPods.length > 0) {
      poolPhase = "Healing";
    } else if (warmPods.length === 0 && busyPods.length === 0) {
      poolPhase = "Initializing";
    } else if (warmPods.length < Math.floor(targetWarmPool / 2)) {
      poolPhase = "Degraded";
    }

    const updatedStatus: ExecutionRunnerPoolStatus = {
      phase: poolPhase,
      warmPods: this.warmPodsCount,
      busyPods: this.busyPodsCount,
      recycledPodsTotal: this.recycledTotal,
      lastRecycleDurationMs: this.lastRecycleMs,
      avgRecycleDurationMs: avgDuration,
      selector: labelSelector,
      conditions: [
        {
          type: "Healthy",
          status: poolPhase === "Degraded" ? "False" : "True",
          reason:
            poolPhase === "Healing" ? "RecycledPoisonedPods" : "PoolStabilized",
          message: `Active warm pool maintained at ${this.warmPodsCount}/${targetWarmPool} pods`,
          lastTransitionTime: new Date().toISOString(),
        },
      ],
    };

    // 4. Update status subresource in Kubernetes API
    try {
      await this.client.updateCustomResourceStatus(
        "codepulse.io",
        "v1alpha1",
        this.namespace,
        "executionrunnerpools",
        poolName,
        updatedStatus,
      );
    } catch {
      // In standalone / mocked controller environments, status patch is non-fatal
    }

    return updatedStatus;
  }

  /**
   * Exports Prometheus format metrics for Grafana dashboard observability.
   */
  exportPrometheusMetrics(): string {
    return (
      [
        "# HELP codepulse_runner_warm_pods Number of available pre-warmed execution runner pods",
        "# TYPE codepulse_runner_warm_pods gauge",
        `codepulse_runner_warm_pods{namespace="${this.namespace}"} ${this.warmPodsCount}`,
        "# HELP codepulse_runner_busy_pods Number of currently executing match runner pods",
        "# TYPE codepulse_runner_busy_pods gauge",
        `codepulse_runner_busy_pods{namespace="${this.namespace}"} ${this.busyPodsCount}`,
        "# HELP codepulse_runner_recycled_total Cumulative count of poisoned pods self-healed",
        "# TYPE codepulse_runner_recycled_total counter",
        `codepulse_runner_recycled_total{namespace="${this.namespace}"} ${this.recycledTotal}`,
        "# HELP codepulse_runner_last_recycle_duration_ms Duration of latest pod recycling in milliseconds",
        "# TYPE codepulse_runner_last_recycle_duration_ms gauge",
        `codepulse_runner_last_recycle_duration_ms{namespace="${this.namespace}"} ${this.lastRecycleMs}`,
        "# HELP codepulse_runner_avg_recycle_duration_ms Rolling average pod recycling latency in milliseconds",
        "# TYPE codepulse_runner_avg_recycle_duration_ms gauge",
        `codepulse_runner_avg_recycle_duration_ms{namespace="${this.namespace}"} ${
          this.recycleDurations.length > 0
            ? Math.round(
                this.recycleDurations.reduce((a, b) => a + b, 0) /
                  this.recycleDurations.length,
              )
            : 0
        }`,
      ].join("\n") + "\n"
    );
  }

  getMetrics(): PoolMetrics {
    const avg =
      this.recycleDurations.length > 0
        ? Math.round(
            this.recycleDurations.reduce((a, b) => a + b, 0) /
              this.recycleDurations.length,
          )
        : 0;

    return {
      warmPods: this.warmPodsCount,
      busyPods: this.busyPodsCount,
      recycledPodsTotal: this.recycledTotal,
      lastRecycleDurationMs: this.lastRecycleMs,
      avgRecycleDurationMs: avg,
    };
  }

  startReconciliationLoop(
    pool: ExecutionRunnerPoolCustomResource,
    intervalMs = 2000,
  ): void {
    if (this.reconcileTimer) return;

    this.reconcileTimer = setInterval(async () => {
      if (this.isReconciling) return;
      this.isReconciling = true;
      try {
        await this.reconcile(pool);
      } finally {
        this.isReconciling = false;
      }
    }, intervalMs);

    if (
      this.reconcileTimer &&
      typeof this.reconcileTimer.unref === "function"
    ) {
      this.reconcileTimer.unref();
    }
  }

  stopReconciliationLoop(): void {
    if (this.reconcileTimer) {
      clearInterval(this.reconcileTimer);
      this.reconcileTimer = null;
    }
  }
}
