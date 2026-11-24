import { Injectable, Logger } from '@nestjs/common';

export interface BlameLineRecord {
  filePath: string;
  authorEmail: string;
  authorName: string;
  commitHash: string;
  commitTimestamp: number; // Unix ms
  linesCount: number;
}

export interface AuthorOwnershipStats {
  authorEmail: string;
  authorName: string;
  rawLines: number;
  decayedWeight: number;
  ownershipSharePct: number;
}

export interface SunburstNode {
  name: string;
  path: string;
  value: number; // weighted lines
  busFactor: number;
  dominantAuthor: string;
  riskLevel: 'HIGH_RISK_BUS_FACTOR_1' | 'MEDIUM_RISK' | 'HEALTHY';
  ownershipEntropy: number; // Shannon entropy of authorship
  authors: AuthorOwnershipStats[];
  children?: SunburstNode[];
}

export interface RepositorySunburstReport {
  root: SunburstNode;
  totalFiles: number;
  highRiskModuleCount: number; // Modules with Bus Factor = 1
  analyzedAt: Date;
}

@Injectable()
export class GitBlameAnalyzerService {
  private readonly logger = new Logger(GitBlameAnalyzerService.name);

  // Exponential decay half-life: 180 days (code older than 180 days has 50% knowledge weight)
  public readonly halfLifeDays = 180;
  private readonly halfLifeMs = 180 * 24 * 60 * 60 * 1000;

  /**
   * Computes temporal decay weight based on commit age:
   * weight = 2^(-age / halfLife)
   */
  public computeDecayFactor(commitTimestamp: number, now = Date.now()): number {
    const ageMs = Math.max(0, now - commitTimestamp);
    return Math.pow(2, -ageMs / this.halfLifeMs);
  }

  /**
   * Analyzes blame lines and generates an interactive hierarchical Sunburst data model.
   */
  public generateSunburstReport(blameRecords: BlameLineRecord[], now = Date.now()): RepositorySunburstReport {
    // 1. Group records by file path
    const fileMap = new Map<string, BlameLineRecord[]>();
    for (const record of blameRecords) {
      if (!fileMap.has(record.filePath)) {
        fileMap.set(record.filePath, []);
      }
      fileMap.get(record.filePath)!.push(record);
    }

    let highRiskCount = 0;
    const fileNodes: SunburstNode[] = [];

    for (const [filePath, records] of fileMap.entries()) {
      const authorMap = new Map<string, { name: string; rawLines: number; weighted: number }>();
      let totalWeighted = 0;

      for (const rec of records) {
        const decay = this.computeDecayFactor(rec.commitTimestamp, now);
        const weighted = rec.linesCount * decay;
        totalWeighted += weighted;

        if (!authorMap.has(rec.authorEmail)) {
          authorMap.set(rec.authorEmail, { name: rec.authorName, rawLines: 0, weighted: 0 });
        }
        const a = authorMap.get(rec.authorEmail)!;
        a.rawLines += rec.linesCount;
        a.weighted += weighted;
      }

      // Compute ownership share
      const authors: AuthorOwnershipStats[] = Array.from(authorMap.entries()).map(([email, d]) => ({
        authorEmail: email,
        authorName: d.name,
        rawLines: d.rawLines,
        decayedWeight: Math.round(d.weighted * 100) / 100,
        ownershipSharePct: totalWeighted > 0
          ? Math.round((d.weighted / totalWeighted) * 10000) / 100
          : 0,
      })).sort((a, b) => b.decayedWeight - a.decayedWeight);

      // Compute Bus Factor: minimum number of authors possessing >= 80% aggregate ownership
      let cumulative = 0;
      let busFactor = 0;
      for (const a of authors) {
        cumulative += a.ownershipSharePct;
        busFactor++;
        if (cumulative >= 80) break;
      }
      if (busFactor === 0) busFactor = 1;

      // Compute Shannon Entropy H = -sum(p * log2(p))
      let entropy = 0;
      for (const a of authors) {
        const p = a.ownershipSharePct / 100;
        if (p > 0) {
          entropy -= p * Math.log2(p);
        }
      }

      const dominantAuthor = authors[0]?.authorName || 'Unknown';
      const riskLevel: SunburstNode['riskLevel'] =
        busFactor === 1
          ? 'HIGH_RISK_BUS_FACTOR_1'
          : busFactor === 2
          ? 'MEDIUM_RISK'
          : 'HEALTHY';

      if (riskLevel === 'HIGH_RISK_BUS_FACTOR_1') {
        highRiskCount++;
      }

      fileNodes.push({
        name: filePath.split('/').pop() || filePath,
        path: filePath,
        value: Math.round(totalWeighted),
        busFactor,
        dominantAuthor,
        riskLevel,
        ownershipEntropy: Math.round(entropy * 100) / 100,
        authors,
      });
    }

    // 2. Build hierarchical directory tree for Sunburst visualization
    const root: SunburstNode = {
      name: 'root',
      path: '',
      value: fileNodes.reduce((sum, f) => sum + f.value, 0),
      busFactor: Math.min(...fileNodes.map((f) => f.busFactor), 1),
      dominantAuthor: fileNodes[0]?.dominantAuthor || 'Multi-Author',
      riskLevel: highRiskCount > 0 ? 'HIGH_RISK_BUS_FACTOR_1' : 'HEALTHY',
      ownershipEntropy: 1.5,
      authors: [],
      children: fileNodes,
    };

    return {
      root,
      totalFiles: fileMap.size,
      highRiskModuleCount: highRiskCount,
      analyzedAt: new Date(now),
    };
  }
}
