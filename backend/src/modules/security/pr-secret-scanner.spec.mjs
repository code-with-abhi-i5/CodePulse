import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class PrSecretScannerService {
  constructor() {
    this.secretRules = [
      { type: 'AWS Access Key', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
      { type: 'GitHub Personal Token', pattern: /\bghp_[A-Za-z0-9]{36}\b/ },
      { type: 'Generic Private Key', pattern: /-----BEGIN\s+(RSA|EC|DSA|OPENSSH)?\s*PRIVATE KEY-----/ },
    ];
  }

  scanDiff(diffText) {
    const lines = diffText.split('\n');
    const detected = [];
    lines.forEach((line, index) => {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        for (const rule of this.secretRules) {
          if (rule.pattern.test(line)) {
            detected.push({ type: rule.type, line: index + 1 });
          }
        }
      }
    });
    return { containsSecrets: detected.length > 0, detectedSecrets: detected };
  }
}

describe('PrSecretScannerService', () => {
  it('detects credential leakage and blocks PR commits with sensitive tokens', () => {
    const service = new PrSecretScannerService();
    const cleanDiff = '+const port = 3000;\n+console.log(port);';
    assert.equal(service.scanDiff(cleanDiff).containsSecrets, false);

    const dirtyDiff = '+const token = "ghp_123456789012345678901234567890123456";';
    const scan = service.scanDiff(dirtyDiff);
    assert.equal(scan.containsSecrets, true);
    assert.equal(scan.detectedSecrets[0].type, 'GitHub Personal Token');
  });
});
