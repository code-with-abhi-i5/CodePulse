/**
 * Architecture Service: Webhook Failure Alerting Engine
 * Subsystem: Webhook Reliability & Developer Alerting
 */

export class WebhookFailureAlertingService {
  private readonly failureCounts = new Map<string, number>(); // webhookId -> consecutiveFailures
  private readonly alerted = new Set<string>();
  private readonly threshold: number;

  constructor(threshold = 5) {
    this.threshold = threshold;
  }

  public recordFailure(webhookId: string): { alertTriggered: boolean; count: number } {
    const current = (this.failureCounts.get(webhookId) || 0) + 1;
    this.failureCounts.set(webhookId, current);

    if (current >= this.threshold && !this.alerted.has(webhookId)) {
      this.alerted.add(webhookId);
      return { alertTriggered: true, count: current };
    }
    return { alertTriggered: false, count: current };
  }

  public recordSuccess(webhookId: string): void {
    this.failureCounts.delete(webhookId);
    this.alerted.delete(webhookId);
  }
}
