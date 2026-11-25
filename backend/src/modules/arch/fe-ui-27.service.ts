/**
 * Architecture Service: Bundle Size Budget Enforcer
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-27]
 */

export interface ChunkAsset {
  name: string;
  sizeBytes: number;
}

export interface BudgetConfig {
  maxVendorChunkBytes: number;
  maxAppChunkBytes: number;
  maxTotalBytes: number;
}

export class BundleSizeBudgetEnforcerService {
  private config: BudgetConfig;

  constructor(config: BudgetConfig = {
    maxVendorChunkBytes: 500 * 1024, // 500 KB
    maxAppChunkBytes: 250 * 1024,    // 250 KB
    maxTotalBytes: 1500 * 1024       // 1.5 MB
  }) {
    this.config = config;
  }

  public auditBundles(chunks: ChunkAsset[]): { passed: boolean; violations: string[]; totalBytes: number } {
    const violations: string[] = [];
    let totalBytes = 0;

    for (const chunk of chunks) {
      totalBytes += chunk.sizeBytes;
      const isVendor = chunk.name.includes('vendor') || chunk.name.includes('node_modules');
      const limit = isVendor ? this.config.maxVendorChunkBytes : this.config.maxAppChunkBytes;

      if (chunk.sizeBytes > limit) {
        violations.push(`Chunk '${chunk.name}' size ${(chunk.sizeBytes / 1024).toFixed(1)} KB exceeds budget of ${(limit / 1024).toFixed(1)} KB`);
      }
    }

    if (totalBytes > this.config.maxTotalBytes) {
      violations.push(`Total bundle size ${(totalBytes / 1024).toFixed(1)} KB exceeds budget of ${(this.config.maxTotalBytes / 1024).toFixed(1)} KB`);
    }

    return {
      passed: violations.length === 0,
      violations,
      totalBytes
    };
  }
}
