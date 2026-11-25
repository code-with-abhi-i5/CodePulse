import { LokiStructuredShipperService } from './loki-structured-shipper.service';

describe('LokiStructuredShipperService', () => {
  let service: LokiStructuredShipperService;
  beforeEach(() => { service = new LokiStructuredShipperService(); });
  it('manages buffer count', () => {
    expect(service.getPendingCount()).toBe(0);
  });
});
