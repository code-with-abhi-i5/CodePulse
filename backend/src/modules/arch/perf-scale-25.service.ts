/**
 * Architecture Service: Permessage-Deflate Optimizer
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-25]
 */

export interface DeflateOptions {
  zlibDeflateOptions: { windowBits: number; memLevel: number };
  serverNoContextTakeover: boolean;
  clientNoContextTakeover: boolean;
  thresholdBytes: number;
}

export class PermessageDeflateOptimizerService {
  public resolveOptions(concurrentSockets: number): DeflateOptions {
    // When sockets > 5,000, reduce windowBits and memLevel to save RAM
    if (concurrentSockets > 5000) {
      return {
        zlibDeflateOptions: { windowBits: 10, memLevel: 5 },
        serverNoContextTakeover: true,
        clientNoContextTakeover: true,
        thresholdBytes: 512
      };
    }

    if (concurrentSockets > 1000) {
      return {
        zlibDeflateOptions: { windowBits: 12, memLevel: 7 },
        serverNoContextTakeover: false,
        clientNoContextTakeover: false,
        thresholdBytes: 256
      };
    }

    return {
      zlibDeflateOptions: { windowBits: 15, memLevel: 8 },
      serverNoContextTakeover: false,
      clientNoContextTakeover: false,
      thresholdBytes: 128
    };
  }

  public shouldCompress(payloadSizeBytes: number, options: DeflateOptions): boolean {
    return payloadSizeBytes >= options.thresholdBytes;
  }
}
