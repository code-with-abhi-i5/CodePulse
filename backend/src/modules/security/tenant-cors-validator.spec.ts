import { TenantCorsValidatorService } from './tenant-cors-validator.service';

describe('TenantCorsValidatorService', () => {
  let service: TenantCorsValidatorService;

  beforeEach(() => {
    service = new TenantCorsValidatorService();
    service.registerTenantDomain('tenant-acme', ['https://acme.codepulse.io']);
  });

  it('validates allowed origins and rejects unauthorized tenant cross-origin requests', () => {
    expect(service.isOriginAllowed('tenant-acme', 'https://acme.codepulse.io')).toBe(true);
    expect(service.isOriginAllowed('tenant-acme', 'https://evil.attacker.com')).toBe(false);
  });
});
