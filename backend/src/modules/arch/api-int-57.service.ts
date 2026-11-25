/**
 * Architecture Service: Webhook Prometheus Metrics Exporter
 * Subsystem: Webhook Observability & Metrics Export
 */

export class WebhookPrometheusMetricsExporterService {
  private totalDeliveries = 0;
  private failedDeliveries = 0;

  public recordDelivery(success: boolean): void {
    this.totalDeliveries++;
    if (!success) this.failedDeliveries++;
  }

  public exportMetrics(): string {
    let out = '# HELP webhook_delivery_total Total webhook delivery attempts\n';
    out += '# TYPE webhook_delivery_total counter\n';
    out += `webhook_delivery_total{status="success"} ${this.totalDeliveries - this.failedDeliveries}\n`;
    out += `webhook_delivery_total{status="failure"} ${this.failedDeliveries}\n`;
    return out;
  }
}
