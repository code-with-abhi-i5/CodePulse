import { Test, TestingModule } from '@nestjs/testing';
import { K8sNamespaceCleanerService } from './k8s-namespace-cleaner.service';
import { PreviewEnvManagerService, PullRequestLifecycleEvent } from './preview-env-manager.service';

describe('PreviewEnvManagerService & K8sNamespaceCleanerService', () => {
  let cleaner: K8sNamespaceCleanerService;
  let manager: PreviewEnvManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [K8sNamespaceCleanerService, PreviewEnvManagerService],
    }).compile();

    cleaner = module.get<K8sNamespaceCleanerService>(K8sNamespaceCleanerService);
    manager = module.get<PreviewEnvManagerService>(PreviewEnvManagerService);
  });

  afterEach(() => {
    manager.reset();
  });

  describe('Preview Environment Provisioning (<60s SLA)', () => {
    it('should provision full-stack environment upon PR opened event', async () => {
      const openEvent: PullRequestLifecycleEvent = {
        action: 'opened',
        prNumber: 42,
        repo: 'code-with-abhi-i5/CodePulse',
        branch: 'feat/cool-feature',
        commitSha: '9f8e7d6c5b4a',
        owner: 'octocat',
      };

      const result = await manager.handlePullRequestEvent(openEvent);
      expect(result.handled).toBe(true);
      expect(result.action).toBe('PROVISIONED');

      const env = result.environment!;
      expect(env.status).toBe('READY');
      expect(env.namespace).toBe('preview-pr-42');
      expect(env.frontendUrl).toBe('https://frontend-pr-42.preview.codepulse.io');
      expect(env.backendUrl).toBe('https://backend-pr-42.preview.codepulse.io');
      expect(env.databaseUri).toContain('db-pr-42.preview-pr-42.svc.cluster.local');

      // Check namespace registered in cleaner
      const ns = cleaner.getNamespace('preview-pr-42');
      expect(ns).toBeDefined();
      expect(ns?.status).toBe('ACTIVE');
      expect(ns?.resources.deployments.length).toBe(3);
    });
  });

  describe('Automated Teardown on PR Closed (100% Leak-Free)', () => {
    it('should completely dismantle namespace when PR is closed', async () => {
      // 1. First open PR
      await manager.handlePullRequestEvent({
        action: 'opened',
        prNumber: 100,
        repo: 'code-with-abhi-i5/CodePulse',
        branch: 'fix/security-bug',
        commitSha: '112233445566',
      });
      expect(manager.getPreviewEnvironment(100)).toBeDefined();
      expect(cleaner.getNamespace('preview-pr-100')).toBeDefined();

      // 2. PR closed event received
      const closeResult = await manager.handlePullRequestEvent({
        action: 'closed',
        prNumber: 100,
        repo: 'code-with-abhi-i5/CodePulse',
        branch: 'fix/security-bug',
        commitSha: '112233445566',
      });

      expect(closeResult.handled).toBe(true);
      expect(closeResult.action).toBe('TEARDOWN_COMPLETED');

      // 3. Verify namespace and resources deleted with zero leaks
      expect(manager.getPreviewEnvironment(100)).toBeUndefined();
      expect(cleaner.getNamespace('preview-pr-100')).toBeUndefined();

      const reports = cleaner.getReapedReports();
      expect(reports.length).toBe(1);
      expect(reports[0].namespace).toBe('preview-pr-100');
      expect(reports[0].reason).toBe('PR_CLOSED');
      expect(reports[0].deletedResourceCount).toBeGreaterThan(0);
    });
  });

  describe('Orphaned Leak Reaper and TTL Eviction', () => {
    it('should detect and reap orphaned namespaces when PR is no longer in open set', async () => {
      // Provision namespaces for PR 10, 11, 12
      for (const pr of [10, 11, 12]) {
        await manager.provisionPreviewEnvironment({
          prNumber: pr,
          repo: 'code-with-abhi-i5/CodePulse',
          branch: `feat/pr-${pr}`,
          commitSha: `sha-${pr}`,
        });
      }

      expect(cleaner.getAllActiveNamespaces().length).toBe(3);

      // Only PR 10 and 12 are open; PR 11 was merged/closed externally without webhook
      const openPrs = [10, 12];
      const reaped = await cleaner.reapOrphanedNamespaces(openPrs);

      expect(reaped.length).toBe(1);
      expect(reaped[0].prNumber).toBe(11);
      expect(reaped[0].reason).toBe('ORPHANED_LEAK');

      // Only PR 10 and 12 remain active
      const remaining = cleaner.getAllActiveNamespaces();
      expect(remaining.map((n) => n.prNumber)).toEqual([10, 12]);
    });

    it('should reap namespaces that have exceeded lifetime TTL', async () => {
      cleaner.registerNamespace({
        name: 'preview-pr-99',
        prNumber: 99,
        owner: 'test-user',
        ttlMinutes: 60,
        resources: { deployments: [], services: [], ingresses: [], pvcs: [] },
      });

      const t0 = Date.now();
      // Probe after 10 minutes (not expired)
      const early = await cleaner.reapExpiredNamespaces(t0 + 10 * 60 * 1000);
      expect(early.length).toBe(0);

      // Probe after 70 minutes (expired!)
      const expired = await cleaner.reapExpiredNamespaces(t0 + 70 * 60 * 1000);
      expect(expired.length).toBe(1);
      expect(expired[0].namespace).toBe('preview-pr-99');
      expect(expired[0].reason).toBe('TTL_EXPIRED');
    });
  });
});
