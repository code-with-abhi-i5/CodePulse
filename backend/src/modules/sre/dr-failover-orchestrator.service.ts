import { RegionHealthStatus, FailoverDecision } from '../../types/sre';

export class DrFailoverOrchestrator {
  private failureThreshold: number = 3;

  evaluateFailover(
    primaryStatus: RegionHealthStatus,
    secondaryStatus: RegionHealthStatus
  ): FailoverDecision {
    if (!primaryStatus.healthy && primaryStatus.consecutiveFailures >= this.failureThreshold) {
      if (secondaryStatus.healthy) {
        return {
          primaryRegion: primaryStatus.regionId,
          activeRegion: secondaryStatus.regionId,
          failoverTriggered: true,
          dnsWeightPrimary: 0,
          dnsWeightSecondary: 100,
          reason: `Primary region ${primaryStatus.regionId} failed ${primaryStatus.consecutiveFailures} consecutive checks. Rerouted 100% traffic to ${secondaryStatus.regionId}`
        };
      }
    }

    return {
      primaryRegion: primaryStatus.regionId,
      activeRegion: primaryStatus.regionId,
      failoverTriggered: false,
      dnsWeightPrimary: 100,
      dnsWeightSecondary: 0,
      reason: `Primary region ${primaryStatus.regionId} is healthy and active`
    };
  }
}
