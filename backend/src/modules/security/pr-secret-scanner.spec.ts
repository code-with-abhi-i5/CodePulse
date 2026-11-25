import { PrSecretScannerService } from './pr-secret-scanner.service';

describe('PrSecretScannerService', () => {
  let service: PrSecretScannerService;

  beforeEach(() => {
    service = new PrSecretScannerService();
  });

  it('scans added diff lines and flags committed secrets and keys', () => {
    const diff = '+const aws = "AKIAIOSFODNN7EXAMPLE";';
    const res = service.scanDiff(diff);
    expect(res.containsSecrets).toBe(true);
    expect(res.detectedSecrets[0].type).toBe('AWS Access Key');
  });
});
