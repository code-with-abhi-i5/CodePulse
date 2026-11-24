import { CommitErrorMatcherService } from './commit-error-matcher.service';
import { RcaCorrelatorService } from './rca-correlator.service';

describe('RcaCorrelatorService & CommitErrorMatcherService', () => {
  let matcher: CommitErrorMatcherService;
  let correlator: RcaCorrelatorService;

  beforeEach(() => {
    matcher = new CommitErrorMatcherService();
    correlator = new RcaCorrelatorService(matcher);
  });

  describe('CommitErrorMatcherService', () => {
    it('should extract typescript file paths from stack traces', () => {
      const stack = `TypeError: Cannot read properties of null
    at ChallengesService.submitSolution (challenges.service.ts:182:20)
    at ChallengesController.submit (challenges.controller.ts:45:12)`;

      const files = matcher.extractFilesFromStackTrace(stack);
      expect(files).toContain('challenges.service.ts');
      expect(files).toContain('challenges.controller.ts');
    });

    it('should correlate error timestamp and file overlap with culprit commit', () => {
      const deployTime = new Date(Date.now() - 5 * 60 * 1000); // 5 mins ago
      matcher.registerDeployment({
        commitSha: 'a1b2c3d4e5f67890',
        prNumber: 420,
        author: 'dev-alex',
        message: 'refactor: modify solution submission validation logic',
        deployedAt: deployTime,
        changedFiles: ['backend/src/modules/challenges/challenges.service.ts'],
      });

      const errorTime = new Date();
      const stack = 'Error: Null pointer exception at challenges.service.ts:182:20';

      const matches = matcher.matchErrorToCommit(errorTime, stack);
      expect(matches.length).toBe(1);
      expect(matches[0].commit.commitSha).toBe('a1b2c3d4e5f67890');
      expect(matches[0].matchedFiles).toContain('backend/src/modules/challenges/challenges.service.ts');
      expect(matches[0].confidenceScore).toBeGreaterThan(0.5);
    });
  });

  describe('RcaCorrelatorService', () => {
    it('should generate actionable revert command when culprit commit is matched', () => {
      const deployTime = new Date(Date.now() - 3 * 60 * 1000);
      matcher.registerDeployment({
        commitSha: '9876543210abcdef',
        prNumber: 512,
        author: 'charlie',
        message: 'feat: add aggressive payment gateway cache',
        deployedAt: deployTime,
        changedFiles: ['backend/src/modules/payments/payment-gateway.service.ts'],
      });

      const stack = 'HttpException: Payment gateway timed out at payment-gateway.service.ts:90:14';
      const alert = correlator.analyzeIncident(24.5, stack);

      expect(alert.culpritAuthor).toBe('charlie');
      expect(alert.culpritPr).toBe(512);
      expect(alert.culpritCommitSha).toBe('9876543210abcdef');
      expect(alert.recommendedRevertCommand).toContain('git revert -m 1 9876543 --no-edit');
      expect(alert.summary).toContain('dev');
    });

    it('should return un-correlated alert if no matching commit found in time window', () => {
      const stack = 'SyntaxError: Unexpected token at unknown-file.js:1:1';
      const alert = correlator.analyzeIncident(10.0, stack);

      expect(alert.culpritCommitSha).toBeUndefined();
      expect(alert.recommendedRevertCommand).toBeUndefined();
    });
  });
});
