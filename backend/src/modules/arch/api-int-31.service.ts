/**
 * Architecture Service: REST API Conditional GET & ETag Service
 * Subsystem: HTTP Caching & Bandwidth Reduction
 */

import crypto from 'node:crypto';

export class ApiConditionalGetEtagService {
  public computeEtag(payload: string | Buffer): string {
    const hash = crypto.createHash('sha1').update(payload).digest('hex');
    return `"${hash.slice(0, 16)}"`;
  }

  public shouldReturnNotModified(etag: string, ifNoneMatchHeader?: string): boolean {
    if (!ifNoneMatchHeader) return false;
    const clientTags = ifNoneMatchHeader.split(',').map(t => t.trim());
    return clientTags.includes(etag) || clientTags.includes('*');
  }
}
