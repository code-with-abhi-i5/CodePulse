import { describe, it } from 'node:test';
import assert from 'node:assert';
import { WebhookPrometheusMetricsExporterService } from './api-int-57.service.ts';

describe('WebhookPrometheusMetricsExporterService (API-INT-57)', () => {
  it('records delivery outcomes and exports Prometheus exposition format', () => {
    const exporter = new WebhookPrometheusMetricsExporterService();
    exporter.recordDelivery(true);
    exporter.recordDelivery(true);
    exporter.recordDelivery(false);

    const metrics = exporter.exportMetrics();
    assert.strictEqual(metrics.includes('webhook_delivery_total{status="success"} 2'), true);
    assert.strictEqual(metrics.includes('webhook_delivery_total{status="failure"} 1'), true);
  });
});
