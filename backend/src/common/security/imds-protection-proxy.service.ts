import { ImdsProbeCheckResult } from '../../types/security';

export class ImdsProtectionProxyService {
  private readonly blockedIps = [
    '169.254.169.254', // AWS/GCP/Azure IMDS IPv4
    'fd00:ec2::254',   // AWS IMDS IPv6
    '127.0.0.1',
    'localhost',
    '::1'
  ];

  public inspectUrl(targetUrl: string): ImdsProbeCheckResult {
    let parsed: URL;
    try {
      parsed = new URL(targetUrl);
    } catch {
      return {
        isSafe: false,
        targetUrl,
        detectedThreat: 'INVALID_URL',
        reason: 'Malformed URL could not be parsed'
      };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check IMDS exact and hex/octal representations
    if (
      hostname === '169.254.169.254' ||
      hostname.includes('169.254') ||
      hostname === '2852039166' || // Decimal integer notation
      hostname === '0xa9fea9fe' ||  // Hex notation
      hostname === 'fd00:ec2::254'
    ) {
      return {
        isSafe: false,
        targetUrl,
        detectedThreat: 'IMDS_ACCESS',
        reason: 'Blocked cloud instance metadata service (IMDS) probe'
      };
    }

    if (hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1') {
      return {
        isSafe: false,
        targetUrl,
        detectedThreat: 'LOCALHOST_PROBE',
        reason: 'Blocked internal localhost loopback probe'
      };
    }

    return {
      isSafe: true,
      targetUrl
    };
  }
}
