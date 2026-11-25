import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class PrometheusAlertCorrelatorService {
  constructor(windowMs = 60000) {
    this.activeIncidents = new Map();
    this.windowMs = windowMs;
  }

  ingestAlert(alert) {
    const key = `${alert.namespace}:${alert.pod}`;
    const now = new Date(alert.startsAt).getTime();
    let incident = this.activeIncidents.get(key);
    if (!incident) {
      incident = {
        incidentId: `inc-${alert.namespace}-${alert.pod}-${now}`,
        rootAlert: alert,
        correlatedAlerts: [],
        pod: alert.pod,
        namespace: alert.namespace,
        totalAlerts: 1,
        severity: alert.severity
      };
      this.activeIncidents.set(key, incident);
      return incident;
    }

    const rootTime = new Date(incident.rootAlert.startsAt).getTime();
    if (Math.abs(now - rootTime) <= this.windowMs) {
      incident.correlatedAlerts.push(alert);
      incident.totalAlerts += 1;
      if (alert.severity === 'critical') incident.severity = 'critical';
    } else {
      incident = {
        incidentId: `inc-${alert.namespace}-${alert.pod}-${now}`,
        rootAlert: alert,
        correlatedAlerts: [],
        pod: alert.pod,
        namespace: alert.namespace,
        totalAlerts: 1,
        severity: alert.severity
      };
      this.activeIncidents.set(key, incident);
    }
    return incident;
  }

  getIncidentCount() {
    return this.activeIncidents.size;
  }

  clear() {
    this.activeIncidents.clear();
  }
}

describe('PrometheusAlertCorrelatorService', () => {
  it('deduplicates and groups pod restart alerts within time window into single incident', () => {
    const service = new PrometheusAlertCorrelatorService(60000);
    const now = new Date().toISOString();

    const incident1 = service.ingestAlert({
      id: 'a1',
      alertname: 'KubePodCrashLooping',
      pod: 'codepulse-api-7b89f-2m1',
      namespace: 'production',
      severity: 'warning',
      startsAt: now,
      labels: { app: 'api' }
    });

    const incident2 = service.ingestAlert({
      id: 'a2',
      alertname: 'HighMemoryUsage',
      pod: 'codepulse-api-7b89f-2m1',
      namespace: 'production',
      severity: 'critical',
      startsAt: new Date(Date.now() + 5000).toISOString(),
      labels: { app: 'api' }
    });

    assert.strictEqual(service.getIncidentCount(), 1);
    assert.strictEqual(incident2.incidentId, incident1.incidentId);
    assert.strictEqual(incident2.totalAlerts, 2);
    assert.strictEqual(incident2.severity, 'critical');
    assert.strictEqual(incident2.correlatedAlerts.length, 1);
  });
});
