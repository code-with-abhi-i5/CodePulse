/**
 * Architecture Service: API Response Compression Negotiator
 * Subsystem: HTTP Compression & Bandwidth Optimization
 */

export class ApiResponseCompressionNegotiatorService {
  public negotiate(acceptEncodingHeader?: string): 'zstd' | 'br' | 'gzip' | 'identity' {
    if (!acceptEncodingHeader || !acceptEncodingHeader.trim()) {
      return 'identity';
    }

    const encodings = acceptEncodingHeader.toLowerCase();

    // Priority: zstd > br > gzip
    if (encodings.includes('zstd')) return 'zstd';
    if (encodings.includes('br')) return 'br';
    if (encodings.includes('gzip')) return 'gzip';
    return 'identity';
  }
}
