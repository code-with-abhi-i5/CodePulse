/**
 * Architecture Service: Webhook Fan-Out Adaptive Concurrency Pool
 * Subsystem: Webhook Outbound Delivery Scaling
 */

export class WebhookAdaptiveConcurrencyPoolService {
  private currentConcurrency: number;
  private readonly minConcurrency: number;
  private readonly maxConcurrency: number;

  constructor(initialConcurrency = 5, minConcurrency = 1, maxConcurrency = 50) {
    this.currentConcurrency = initialConcurrency;
    this.minConcurrency = minConcurrency;
    this.maxConcurrency = maxConcurrency;
  }

  public recordLatencySample(latencyMs: number): number {
    // If subscriber latency is low (<200ms), increase concurrency
    if (latencyMs < 200) {
      if (this.currentConcurrency < this.maxConcurrency) {
        this.currentConcurrency++;
      }
    } else if (latencyMs > 1000) { // High latency (>1000ms), back off concurrency
      if (this.currentConcurrency > this.minConcurrency) {
        this.currentConcurrency--;
      }
    }
    return this.currentConcurrency;
  }

  public getConcurrency(): number {
    return this.currentConcurrency;
  }
}
