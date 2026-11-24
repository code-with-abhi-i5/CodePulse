import { Test, TestingModule } from '@nestjs/testing';
import { GitBlameAnalyzerService, BlameLineRecord } from './git-blame-analyzer.service';

describe('GitBlameAnalyzerService', () => {
  let service: GitBlameAnalyzerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GitBlameAnalyzerService],
    }).compile();

    service = module.get<GitBlameAnalyzerService>(GitBlameAnalyzerService);
  });

  describe('Temporal Half-Life Decay', () => {
    it('computes decay factor of 1.0 for recent commits and 0.5 for 180-day old commits', () => {
      const now = 1000000000000;
      expect(service.computeDecayFactor(now, now)).toBe(1.0);

      const halfLifeMs = 180 * 24 * 60 * 60 * 1000;
      const factor180 = service.computeDecayFactor(now - halfLifeMs, now);
      expect(factor180).toBeCloseTo(0.5, 2);
    });
  });

  describe('Sunburst Bus Factor Calculation', () => {
    it('identifies high risk module with Bus Factor = 1 when single author owns >80%', () => {
      const now = Date.now();
      const blameRecords: BlameLineRecord[] = [
        {
          filePath: 'backend/src/crypto/zkp.service.ts',
          authorEmail: 'satoshi@codepulse.io',
          authorName: 'Satoshi',
          commitHash: 'abc1',
          commitTimestamp: now - 5 * 24 * 60 * 60 * 1000,
          linesCount: 950,
        },
        {
          filePath: 'backend/src/crypto/zkp.service.ts',
          authorEmail: 'alice@codepulse.io',
          authorName: 'Alice',
          commitHash: 'abc2',
          commitTimestamp: now - 10 * 24 * 60 * 60 * 1000,
          linesCount: 50,
        },
      ];

      const report = service.generateSunburstReport(blameRecords, now);
      expect(report.totalFiles).toBe(1);
      expect(report.highRiskModuleCount).toBe(1);

      const fileNode = report.root.children![0];
      expect(fileNode.busFactor).toBe(1);
      expect(fileNode.riskLevel).toBe('HIGH_RISK_BUS_FACTOR_1');
      expect(fileNode.dominantAuthor).toBe('Satoshi');
      expect(fileNode.authors[0].ownershipSharePct).toBeGreaterThan(90);
    });

    it('identifies healthy multi-maintainer distribution (Bus Factor >= 3)', () => {
      const now = Date.now();
      const blameRecords: BlameLineRecord[] = [
        {
          filePath: 'src/components/button.tsx',
          authorEmail: 'dev1@codepulse.io',
          authorName: 'Dev 1',
          commitHash: 'h1',
          commitTimestamp: now,
          linesCount: 100, // 33%
        },
        {
          filePath: 'src/components/button.tsx',
          authorEmail: 'dev2@codepulse.io',
          authorName: 'Dev 2',
          commitHash: 'h2',
          commitTimestamp: now,
          linesCount: 100, // 33%
        },
        {
          filePath: 'src/components/button.tsx',
          authorEmail: 'dev3@codepulse.io',
          authorName: 'Dev 3',
          commitHash: 'h3',
          commitTimestamp: now,
          linesCount: 100, // 33%
        },
      ];

      const report = service.generateSunburstReport(blameRecords, now);
      const fileNode = report.root.children![0];
      expect(fileNode.busFactor).toBe(3);
      expect(fileNode.riskLevel).toBe('HEALTHY');
      expect(fileNode.ownershipEntropy).toBeGreaterThan(1.4);
    });
  });
});
