import { Injectable } from '@nestjs/common';
import { PrometheusAlert, CorrelatedIncident } from '../../types/observability';

@Injectable()
export class PrometheusAlertCorrelatorService {
  private activeIncidents: Map<string, CorrelatedIncident> = new Map();
  private readonly windowMs: number;

  constructor(windowMs = 60000) {
    this.windowMs = windowMs;
  }

  ingestAlert(alert: PrometheusAlert): CorrelatedIncident {
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
      if (alert.severity === 'critical') {
        incident.severity = 'critical';
      }
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

  getIncidentCount(): number {
    return this.activeIncidents.size;
  }

  clear(): void {
    this.activeIncidents.clear();
  }
}
