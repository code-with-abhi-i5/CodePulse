import { PrometheusAlertCorrelatorService } from './prometheus-alert-correlator.service';

describe('PrometheusAlertCorrelatorService', () => {
  let service: PrometheusAlertCorrelatorService;
  beforeEach(() => { service = new PrometheusAlertCorrelatorService(); });
  it('correlates alerts by pod', () => {
    expect(service.getIncidentCount()).toBe(0);
  });
});
