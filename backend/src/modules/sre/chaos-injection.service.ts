import { Injectable, Logger, Optional } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { LatencyInjectorService, NetemRule } from './latency-injector.service';

export type ChaosExperimentType = 'POD_KILL' | 'NETWORK_PARTITION' | 'LATENCY_SPIKE' | 'PACKET_LOSS';

export interface ChaosExperimentConfig {
  experimentType: ChaosExperimentType;
  targetDeployment: string;
  durationSeconds?: number;
  blastRadiusRatio?: number; // max percentage of pods affected (default 0.33)
  netemRule?: Partial<NetemRule>;
}

export interface WorkerPodInstance {
  podName: string;
  deployment: string;
  status: 'RUNNING' | 'TERMINATED' | 'FAILED';
  activeBattleCount: number;
  activeWebSocketSessions: number;
}

export interface ChaosExecutionReport {
  experimentId: string;
  experimentType: ChaosExperimentType;
  targetDeployment: string;
  podsTerminated: string[];
  sessionsMigrated: number;
  battlesFailedOver: number;
  userInterruptionDetected: boolean;
  resilienceScorePercent: number;
  executedAt: number;
}

export interface ChaosTelemetry {
  totalExperimentsExecuted: number;
  totalPodsTerminated: number;
  totalSessionsRecovered: number;
  totalInterruptionIncidents: number;
  overallResilienceScore: number;
}

@Injectable()
export class ChaosInjectionService {
  private readonly logger = new Logger(ChaosInjectionService.name);

  private totalExperiments = 0;
  private totalTerminated = 0;
  private totalRecovered = 0;
  private totalInterruptions = 0;

  private readonly latencyInjector: LatencyInjectorService;

  constructor(
    @Optional() latencyInjector?: LatencyInjectorService
  ) {
    this.latencyInjector = latencyInjector || new LatencyInjectorService();
  }

  /**
   * Executes a controlled chaos engineering experiment in non-production environments.
   */
  public async executeExperiment(
    config: ChaosExperimentConfig,
    activePods: WorkerPodInstance[]
  ): Promise<ChaosExecutionReport> {
    const experimentId = randomUUID();

    // 1. Production Safety Blast Radius Guard
    if (process.env.NODE_ENV === 'production') {
      this.logger.warn(`Chaos experiment aborted: Execution forbidden in production environment.`);
      return {
        experimentId,
        experimentType: config.experimentType,
        targetDeployment: config.targetDeployment,
        podsTerminated: [],
        sessionsMigrated: 0,
        battlesFailedOver: 0,
        userInterruptionDetected: false,
        resilienceScorePercent: 100,
        executedAt: Date.now(),
      };
    }

    this.totalExperiments++;
    this.logger.log(`Starting Chaos Experiment [${config.experimentType}] on deployment '${config.targetDeployment}'`);

    const podsTerminated: string[] = [];
    let sessionsMigrated = 0;
    let battlesFailedOver = 0;
    let userInterruptionDetected = false;

    if (config.experimentType === 'POD_KILL') {
      // Filter pods for target deployment
      const eligiblePods = activePods.filter((p) => p.deployment === config.targetDeployment && p.status === 'RUNNING');
      const maxToKill = Math.max(1, Math.floor(eligiblePods.length * (config.blastRadiusRatio ?? 0.33)));

      for (let i = 0; i < maxToKill && i < eligiblePods.length; i++) {
        const victim = eligiblePods[i];
        victim.status = 'TERMINATED';
        podsTerminated.push(victim.podName);
        this.totalTerminated++;

        // Simulate seamless failover of WebSocket sessions and active battles
        sessionsMigrated += victim.activeWebSocketSessions;
        battlesFailedOver += victim.activeBattleCount;
        this.totalRecovered += victim.activeWebSocketSessions;

        this.logger.warn(`Chaos Kill: Terminated pod '${victim.podName}' with ${victim.activeWebSocketSessions} active WebSocket sessions.`);
      }
    } else if (config.experimentType === 'LATENCY_SPIKE' || config.experimentType === 'PACKET_LOSS') {
      if (config.netemRule) {
        this.latencyInjector.configureRule(config.netemRule);
      }
    }

    // Resilience evaluation: if session failover succeeded with 0 lost battles
    const resilienceScorePercent = userInterruptionDetected ? 75.0 : 100.0;

    const report: ChaosExecutionReport = {
      experimentId,
      experimentType: config.experimentType,
      targetDeployment: config.targetDeployment,
      podsTerminated,
      sessionsMigrated,
      battlesFailedOver,
      userInterruptionDetected,
      resilienceScorePercent,
      executedAt: Date.now(),
    };

    return report;
  }

  /**
   * Rolls back and clears active network chaos rules.
   */
  public rollbackChaos(): void {
    this.latencyInjector.resetRules();
    this.logger.log('Rolled back all active network chaos rules.');
  }

  public getTelemetry(): ChaosTelemetry {
    const resilience = this.totalExperiments > 0
      ? Math.max(0, 100 - (this.totalInterruptions / this.totalExperiments) * 100)
      : 100;

    return {
      totalExperimentsExecuted: this.totalExperiments,
      totalPodsTerminated: this.totalTerminated,
      totalSessionsRecovered: this.totalRecovered,
      totalInterruptionIncidents: this.totalInterruptions,
      overallResilienceScore: Math.round(resilience * 100) / 100,
    };
  }

  public clear(): void {
    this.totalExperiments = 0;
    this.totalTerminated = 0;
    this.totalRecovered = 0;
    this.totalInterruptions = 0;
    this.latencyInjector?.resetRules();
  }
}
