import { DomainCertificateStatus } from '../../types/tenancy';

export class CustomDomainTlsProvisioner {
  private canonicalTarget: string;

  constructor(canonicalTarget: string = 'ingress.codepulse.io') {
    this.canonicalTarget = canonicalTarget;
  }

  verifyCname(cnameTarget: string): boolean {
    return cnameTarget.toLowerCase().replace(/\.$/, '') === this.canonicalTarget.toLowerCase();
  }

  provisionTlsCertificate(domain: string, tenantId: string, resolvedCname: string): DomainCertificateStatus {
    const verified = this.verifyCname(resolvedCname);
    if (!verified) {
      return {
        domain,
        tenantId,
        cnameVerified: false,
        tlsCertificateIssued: false,
        status: 'pending_cname'
      };
    }

    const expires = new Date();
    expires.setDate(expires.getDate() + 90);

    return {
      domain,
      tenantId,
      cnameVerified: true,
      tlsCertificateIssued: true,
      expiresAt: expires.toISOString(),
      status: 'active'
    };
  }
}
