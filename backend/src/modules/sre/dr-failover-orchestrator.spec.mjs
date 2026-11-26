import test from 'node:test';
import assert from 'node:assert/strict';

class DrFailoverOrchestrator {
  constructor(failureThreshold = 3) {
    this.failureThreshold = failureThreshold;
  }

  evaluateFailover(primaryStatus, secondaryStatus) {
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

test('DrFailoverOrchestrator - shifts DNS traffic to secondary region upon confirmed primary loss', () => {
  const orchestrator = new DrFailoverOrchestrator(3);

  const healthyPrimary = { regionId: 'us-east-1', healthy: true, consecutiveFailures: 0, lastHeartbeat: Date.now() };
  const healthySecondary = { regionId: 'us-west-2', healthy: true, consecutiveFailures: 0, lastHeartbeat: Date.now() };

  const norm = orchestrator.evaluateFailover(healthyPrimary, healthySecondary);
  assert.strictEqual(norm.failoverTriggered, false);
  assert.strictEqual(norm.dnsWeightPrimary, 100);

  const failedPrimary = { regionId: 'us-east-1', healthy: false, consecutiveFailures: 3, lastHeartbeat: Date.now() - 30000 };
  const failover = orchestrator.evaluateFailover(failedPrimary, healthySecondary);
  assert.strictEqual(failover.failoverTriggered, true);
  assert.strictEqual(failover.activeRegion, 'us-west-2');
  assert.strictEqual(failover.dnsWeightPrimary, 0);
  assert.strictEqual(failover.dnsWeightSecondary, 100);
});
