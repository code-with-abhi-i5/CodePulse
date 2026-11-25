/**
 * Architecture Service: Kubernetes Probe Calibrator
 * Subsystem: Advanced DevOps & Infrastructure Automation [DEVOPS-INFRA-23]
 */

export interface ProbeConfig {
  initialDelaySeconds: number;
  periodSeconds: number;
  timeoutSeconds: number;
  failureThreshold: number;
}

export interface ContainerProbes {
  startupProbe: ProbeConfig;
  readinessProbe: ProbeConfig;
  livenessProbe: ProbeConfig;
}

export class K8sProbeCalibratorService {
  public calibrateProbes(p99StartupSeconds: number): ContainerProbes {
    const totalStartupAllowance = Math.ceil(p99StartupSeconds * 1.5);
    const startupPeriod = 5;
    const startupFailures = Math.ceil(totalStartupAllowance / startupPeriod);

    return {
      startupProbe: {
        initialDelaySeconds: 5,
        periodSeconds: startupPeriod,
        timeoutSeconds: 2,
        failureThreshold: startupFailures
      },
      readinessProbe: {
        initialDelaySeconds: 2,
        periodSeconds: 5,
        timeoutSeconds: 2,
        failureThreshold: 3
      },
      livenessProbe: {
        initialDelaySeconds: 5,
        periodSeconds: 10,
        timeoutSeconds: 3,
        failureThreshold: 3
      }
    };
  }
}
