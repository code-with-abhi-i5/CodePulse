import { Injectable } from '@nestjs/common';
import { SecretScanResult } from '../../types/security';

@Injectable()
export class PrSecretScannerService {
  private readonly secretRules = [
    { type: 'AWS Access Key', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
    { type: 'GitHub Personal Token', pattern: /\bghp_[A-Za-z0-9]{36}\b/ },
    { type: 'Generic Private Key', pattern: /-----BEGIN\s+(RSA|EC|DSA|OPENSSH)?\s*PRIVATE KEY-----/ },
    { type: 'Slack Webhook URL', pattern: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]+/ },
  ];

  scanDiff(diffText: string): SecretScanResult {
    const lines = diffText.split('\n');
    const detected: Array<{ type: string; line: number }> = [];

    lines.forEach((line, index) => {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        for (const rule of this.secretRules) {
          if (rule.pattern.test(line)) {
            detected.push({ type: rule.type, line: index + 1 });
          }
        }
      }
    });

    return {
      containsSecrets: detected.length > 0,
      detectedSecrets: detected,
    };
  }
}
