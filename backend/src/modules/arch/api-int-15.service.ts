/**
 * Architecture Service: Multi-Version API Route Content Negotiation
 * Subsystem: API Routing & Versioning
 */

export class ApiContentNegotiationService {
  private readonly defaultVersion: string;

  constructor(defaultVersion = 'v1') {
    this.defaultVersion = defaultVersion;
  }

  public resolveVersion(path: string, acceptHeader?: string, versionHeader?: string): string {
    // 1. Direct header: X-API-Version: v2
    if (versionHeader && /^v[0-9]+$/i.test(versionHeader.trim())) {
      return versionHeader.trim().toLowerCase();
    }

    // 2. URL path segment: /v2/...
    const pathMatch = path.match(/^\/(v[0-9]+)(\/|$)/i);
    if (pathMatch) {
      return pathMatch[1].toLowerCase();
    }

    // 3. Accept content negotiation: application/vnd.codepulse.v2+json
    if (acceptHeader) {
      const acceptMatch = acceptHeader.match(/application\/vnd\.codepulse\.(v[0-9]+)\+json/i);
      if (acceptMatch) {
        return acceptMatch[1].toLowerCase();
      }
    }

    return this.defaultVersion;
  }
}
