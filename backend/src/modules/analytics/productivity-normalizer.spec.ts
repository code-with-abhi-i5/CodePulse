import { Test, TestingModule } from '@nestjs/testing';
import { ChurnFilterService } from './churn-filter.service';
import { ProductivityNormalizerService, DeveloperCommitContribution } from './productivity-normalizer.service';

describe('ProductivityNormalizerService & ChurnFilterService', () => {
  let churnFilter: ChurnFilterService;
  let normalizer: ProductivityNormalizerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChurnFilterService, ProductivityNormalizerService],
    }).compile();

    churnFilter = module.get<ChurnFilterService>(ChurnFilterService);
    normalizer = module.get<ProductivityNormalizerService>(ProductivityNormalizerService);
  });

  describe('Anti-LoC Gaming & Generated File Rejection', () => {
    it('discounts 10,000 lines from package-lock.json and flags LoC gaming', () => {
      const gamedContribution: DeveloperCommitContribution = {
        commitSha: 'c1',
        authorId: 'cheater_1',
        files: [
          {
            filePath: 'package-lock.json',
            linesAdded: 12000,
            linesDeleted: 200,
          },
          {
            filePath: 'dist/bundle.min.js',
            linesAdded: 5000,
            linesDeleted: 0,
          },
          {
            filePath: 'src/main.ts',
            linesAdded: 25,
            linesDeleted: 2,
          },
        ],
      };

      const result = normalizer.evaluateContribution(gamedContribution);
      expect(result.rawLinesAdded).toBe(17025);
      expect(result.ignoredBloatLines).toBe(17200); // package-lock + min.js ignored
      expect(result.netMeaningfulLines).toBe(25);
      expect(result.antiGamingAssessment.locGamingDetected).toBe(true);
      expect(result.antiGamingAssessment.genuineContributionRatio).toBeLessThan(0.01);
      expect(result.normalizedContributionScore).toBeLessThan(65);
    });

    it('awards high fair score to algorithmic code and unit tests without raw line inflation', () => {
      const genuineContribution: DeveloperCommitContribution = {
        commitSha: 'c2',
        authorId: 'solid_dev',
        files: [
          {
            filePath: 'src/algorithms/raft.service.ts',
            linesAdded: 150,
            linesDeleted: 10,
          },
          {
            filePath: 'src/algorithms/raft.spec.ts',
            linesAdded: 180,
            linesDeleted: 5,
          },
        ],
      };

      const result = normalizer.evaluateContribution(genuineContribution);
      expect(result.ignoredBloatLines).toBe(0);
      expect(result.netMeaningfulLines).toBe(330);
      expect(result.antiGamingAssessment.locGamingDetected).toBe(false);
      expect(result.normalizedContributionScore).toBeGreaterThanOrEqual(70);
    });
  });

  describe('Formatting Churn Detection', () => {
    it('discounts pure whitespace diff additions in patch content', () => {
      const whitespacePatch = `
+   
+    
+   
+ export const val = 1;
`;
      const diffResult = churnFilter.filterFileDiff({
        filePath: 'src/constants.ts',
        linesAdded: 4,
        linesDeleted: 0,
        patchContent: whitespacePatch,
      });

      expect(diffResult.meaningfulAdded).toBe(1); // Only 1 line had actual content
    });
  });
});
