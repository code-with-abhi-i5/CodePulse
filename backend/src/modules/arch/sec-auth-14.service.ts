/**
 * Architecture Service: Zero-Trust SPIFFE/SPIRE SVID Authenticator
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-14]
 */

export interface SpiffeId {
  trustDomain: string;
  path: string;
}

export class SpiffeSvidAuthenticatorService {
  private allowedTrustDomain: string;

  constructor(allowedTrustDomain: string = 'codepulse.io') {
    this.allowedTrustDomain = allowedTrustDomain;
  }

  public parseSpiffeId(uri: string): SpiffeId {
    const match = uri.match(/^spiffe:\/\/([a-zA-Z0-9.-]+)(\/.*)$/);
    if (!match) {
      throw new Error(`Invalid SPIFFE ID format: '${uri}'`);
    }

    return {
      trustDomain: match[1],
      path: match[2]
    };
  }

  public isAuthorizedService(spiffeUri: string, allowedServices: string[]): boolean {
    try {
      const parsed = this.parseSpiffeId(spiffeUri);
      if (parsed.trustDomain !== this.allowedTrustDomain) {
        return false;
      }

      return allowedServices.some((svc) => parsed.path.endsWith(`/${svc}`) || parsed.path === svc);
    } catch {
      return false;
    }
  }
}
