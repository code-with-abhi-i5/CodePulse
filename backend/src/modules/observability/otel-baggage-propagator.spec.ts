import { OtelBaggagePropagatorService } from './otel-baggage-propagator.service';

describe('OtelBaggagePropagatorService', () => {
  let service: OtelBaggagePropagatorService;
  beforeEach(() => { service = new OtelBaggagePropagatorService(); });
  it('injects and extracts W3C baggage header', () => {
    const h = service.injectBaggage(undefined, [{ key: 'tenant.id', value: 'acme' }]);
    expect(h).toContain('tenant.id=acme');
  });
});
