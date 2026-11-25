/**
 * Architecture Service: Subresource Integrity (SRI) Hash Injector
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-19]
 */

import crypto from 'node:crypto';

export class SubresourceIntegrityInjectorService {
  public generateSriHash(content: string | Buffer, algorithm: 'sha384' | 'sha512' = 'sha384'): string {
    const hash = crypto.createHash(algorithm).update(content).digest('base64');
    return `${algorithm}-${hash}`;
  }

  public injectSriIntoTag(scriptTagHtml: string, assetContent: string | Buffer): string {
    const sriHash = this.generateSriHash(assetContent);
    return scriptTagHtml.replace(/>$/, ` integrity="${sriHash}" crossorigin="anonymous">`);
  }
}
