/**
 * Architecture Service: External Webhook Endpoint Health Scanner
 * Subsystem: Webhook Delivery Reliability & Circuit Breaking
 */

export interface WebhookEndpointStatus {
  url: string;
  consecutiveFailures: number;
  active: boolean;
  disabledAt?: number;
}

export class WebhookEndpointHealthScannerService {
  private readonly maxConsecutiveFailures: number;
  private readonly endpoints = new Map<string, WebhookEndpointStatus>();

  constructor(maxConsecutiveFailures = 5) {
    this.maxConsecutiveFailures = maxConsecutiveFailures;
  }

  public registerEndpoint(url: string): void {
    if (!this.endpoints.has(url)) {
      this.endpoints.set(url, { url, consecutiveFailures: 0, active: true });
    }
  }

  public recordDeliveryResult(url: string, success: boolean): WebhookEndpointStatus {
    this.registerEndpoint(url);
    const status = this.endpoints.get(url)!;

    if (success) {
      status.consecutiveFailures = 0;
    } else {
      status.consecutiveFailures++;
      if (status.consecutiveFailures >= this.maxConsecutiveFailures) {
        status.active = false;
        status.disabledAt = Date.now();
      }
    }
    return status;
  }

  public isEndpointActive(url: string): boolean {
    return this.endpoints.get(url)?.active ?? false;
  }
}
