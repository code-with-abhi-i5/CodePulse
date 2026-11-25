/**
 * Architecture Service: TLS Configuration Auditor
 * Subsystem: Enterprise Authentication & Cryptography [SEC-AUTH-43]
 */

export interface TlsConfiguration {
  minVersion: string;
  maxVersion: string;
  ciphers: string[];
}

export interface AuditResult {
  compliant: boolean;
  violations: string[];
  recommendedConfig: TlsConfiguration;
}

export class TlsConfigurationAuditorService {
  private allowedProtocols: string[] = ['TLSv1.3'];
  private approvedCiphers: string[] = [
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_AES_128_GCM_SHA256'
  ];

  public auditTlsConfig(config: TlsConfiguration): AuditResult {
    const violations: string[] = [];

    if (config.minVersion !== 'TLSv1.3') {
      violations.push(`Insecure minVersion '${config.minVersion}'. TLS 1.3 must be enforced as minimum protocol.`);
    }

    if (config.maxVersion !== 'TLSv1.3') {
      violations.push(`Incompatible maxVersion '${config.maxVersion}'. Expected TLSv1.3.`);
    }

    const unapproved = config.ciphers.filter(c => !this.approvedCiphers.includes(c));
    if (unapproved.length > 0) {
      violations.push(`Weak or deprecated ciphers detected: ${unapproved.join(', ')}`);
    }

    return {
      compliant: violations.length === 0,
      violations,
      recommendedConfig: {
        minVersion: 'TLSv1.3',
        maxVersion: 'TLSv1.3',
        ciphers: [...this.approvedCiphers]
      }
    };
  }
}
