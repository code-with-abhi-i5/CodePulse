/**
 * Architecture Service: Payload Compression Negotiator
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-04]
 */

export type CompressionAlgorithm = 'zstd' | 'br' | 'gzip' | 'identity';

export interface NegotiatedEncoding {
  algorithm: CompressionAlgorithm;
  varyHeader: string;
  shouldCompress: boolean;
}

export class PayloadCompressionNegotiatorService {
  private minCompressSizeBytes: number;

  constructor(minCompressSizeBytes: number = 1024) {
    this.minCompressSizeBytes = minCompressSizeBytes;
  }

  public negotiate(acceptEncodingHeader: string = '', payloadSizeBytes: number): NegotiatedEncoding {
    if (payloadSizeBytes < this.minCompressSizeBytes) {
      return {
        algorithm: 'identity',
        varyHeader: 'Accept-Encoding',
        shouldCompress: false
      };
    }

    const header = acceptEncodingHeader.toLowerCase();
    if (header.includes('zstd')) {
      return { algorithm: 'zstd', varyHeader: 'Accept-Encoding', shouldCompress: true };
    }
    if (header.includes('br')) {
      return { algorithm: 'br', varyHeader: 'Accept-Encoding', shouldCompress: true };
    }
    if (header.includes('gzip')) {
      return { algorithm: 'gzip', varyHeader: 'Accept-Encoding', shouldCompress: true };
    }

    return { algorithm: 'identity', varyHeader: 'Accept-Encoding', shouldCompress: false };
  }
}
