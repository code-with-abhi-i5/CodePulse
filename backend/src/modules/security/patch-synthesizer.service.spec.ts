import { Test, TestingModule } from '@nestjs/testing';
import {
  PatchSynthesizerService,
  VulnerabilityAdvisory,
} from './patch-synthesizer.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PatchSynthesizerService', () => {
  let service: PatchSynthesizerService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      securityPatch: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'patch-1', ...data })),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'patch-1',
            cveId: 'CVE-2024-37890',
            packageName: 'ws',
            currentVersion: '8.16.0',
            patchedVersion: '8.17.1',
            cvssScore: 8.8,
            severity: 'HIGH',
            advisorySource: 'OSV',
            advisoryUrl: 'https://osv.dev/vulnerability/GHSA-79j7-qpx6-mpp8',
            vulnerabilitySummary: 'Denial of Service via improper handling of continuous frame extensions',
            breakingChanges: JSON.stringify([
              {
                type: 'REMOVED_FUNCTION',
                originalSymbol: 'createWebSocketStream',
                replacementSymbol: 'createWebSocketStreamSafe',
                reason: 'Deprecated',
                migrationAdvice: 'Use wrapper',
              },
            ]),
            shimCode: 'export * from "ws";',
            diffSummary: '--- a/package.json\n+++ b/package.json',
            testPassRate: 1.0,
            verifiedInSandbox: true,
            pullRequestNumber: 1234,
            pullRequestTitle: 'fix(security): resolve CVE-2024-37890',
            pullRequestUrl: 'https://github.com/code-with-abhi-i5/CodePulse/pull/1234',
            status: 'SYNTHESIZED',
            createdAt: new Date(),
          },
        ]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatchSynthesizerService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<PatchSynthesizerService>(PatchSynthesizerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Advisory Query & Semver Range Parsing', () => {
    it('should evaluate semver vulnerability ranges correctly', () => {
      // Range: "< 3.9.7"
      expect(service.isVersionVulnerable('3.9.0', '< 3.9.7')).toBe(true);
      expect(service.isVersionVulnerable('3.9.7', '< 3.9.7')).toBe(false);
      expect(service.isVersionVulnerable('4.0.0', '< 3.9.7')).toBe(false);

      // Range: ">= 8.0.0, < 8.17.1"
      expect(service.isVersionVulnerable('8.16.0', '>= 8.0.0, < 8.17.1')).toBe(true);
      expect(service.isVersionVulnerable('7.5.0', '>= 8.0.0, < 8.17.1')).toBe(false);
      expect(service.isVersionVulnerable('8.17.1', '>= 8.0.0, < 8.17.1')).toBe(false);
    });

    it('should query OSV and GitHub advisories for package vulnerabilities', async () => {
      const advisories = await service.queryOsvAdvisory('ws', '8.16.0');
      expect(advisories.length).toBeGreaterThan(0);
      expect(advisories[0].packageName).toBe('ws');
      expect(advisories[0].cveId).toContain('CVE-2024-37890');

      const githubAdvisory = await service.queryGithubAdvisory('express-rate-limit');
      expect(githubAdvisory).toBeDefined();
      expect(githubAdvisory?.cveId).toBe('CVE-2024-29041');
    });

    it('should scan dependency manifest and detect critical zero-day CVEs', async () => {
      const scanResult = await service.scanDependencies({
        dependencies: {
          ws: '^8.16.0',
          mysql2: '^3.9.0',
          lodash: '^4.17.21',
        },
      });

      expect(scanResult.scannedCount).toBe(3);
      expect(scanResult.vulnerabilitiesDetected.length).toBeGreaterThanOrEqual(2);
      expect(scanResult.criticalCount + scanResult.highCount).toBeGreaterThanOrEqual(2);
      expect(scanResult.requiresPatchCount).toBe(scanResult.vulnerabilitiesDetected.length);
    });
  });

  describe('Breaking Changes & Shim Code Generation', () => {
    it('should analyze breaking API changes between versions', async () => {
      const changes = await service.detectBreakingChanges(
        'ws',
        '8.16.0',
        '8.17.1',
        ['createWebSocketStream', 'handleProtocols'],
      );

      expect(changes.length).toBe(2);
      expect(changes[0].originalSymbol).toBe('createWebSocketStream');
      expect(changes[0].type).toBe('REMOVED_FUNCTION');
      expect(changes[0].replacementSymbol).toBe('createWebSocketStreamSafe');
    });

    it('should synthesize backward-compatible shim code preserving legacy API signatures', () => {
      const breakingChanges = [
        {
          type: 'REMOVED_FUNCTION' as const,
          originalSymbol: 'createCipherLegacy',
          replacementSymbol: 'createCipherLegacySafe',
          reason: 'Deprecated',
          migrationAdvice: 'Forward to createCipheriv',
        },
      ];

      const shim = service.generateCompatibilityShim(
        'crypto-adapter',
        '1.0.0',
        '2.0.0',
        breakingChanges,
      );

      expect(shim.fileName).toContain('crypto-adapter-shim.ts');
      expect(shim.shimContent).toContain("import * as upstream from 'crypto-adapter';");
      expect(shim.shimContent).toContain('export function createCipherLegacy');
      expect(shim.adapterExports).toContain('createCipherLegacy');
      expect(shim.deprecationWarning).toBe(true);
    });
  });

  describe('Sandbox Verification & Zero Regressions', () => {
    it('should verify synthesized patch in sandbox with 100% test pass rate', async () => {
      const shim = service.generateCompatibilityShim(
        'ws',
        '8.16.0',
        '8.17.1',
        [
          {
            type: 'REMOVED_FUNCTION',
            originalSymbol: 'createWebSocketStream',
            replacementSymbol: 'createWebSocketStreamSafe',
            reason: 'Security fix',
            migrationAdvice: 'Use shim',
          },
        ],
      );

      const verification = await service.verifyInSandbox('ws', '8.17.1', shim);

      expect(verification.passed).toBe(true);
      expect(verification.passRate).toBe(1.0);
      expect(verification.compilationErrors.length).toBe(0);
      expect(verification.zeroRegressionsVerified).toBe(true);
      expect(verification.testResults.passed).toBe(verification.testResults.total);
    });
  });

  describe('End-to-End Patch Synthesis & Pull Request Creation', () => {
    it('should synthesize automated security patch and prepare pull request', async () => {
      const advisory: VulnerabilityAdvisory = {
        cveId: 'CVE-2024-21508',
        packageName: 'mysql2',
        ecosystem: 'npm',
        vulnerableRange: '< 3.9.7',
        currentVersion: '3.9.0',
        patchedVersion: '3.9.7',
        cvssScore: 9.8,
        severity: 'CRITICAL',
        source: 'OSV',
        advisoryUrl: 'https://osv.dev/vulnerability/GHSA-v7wg-c24q-3948',
        summary: 'Remote Code Execution via parser parameter injection',
        deprecatedFunctions: ['escapeIdLegacy'],
      };

      const patch = await service.synthesizeSecurityPatch(advisory);

      expect(patch.cveId).toBe('CVE-2024-21508');
      expect(patch.packageName).toBe('mysql2');
      expect(patch.cvssScore).toBe(9.8);
      expect(patch.severity).toBe('CRITICAL');
      expect(patch.verifiedInSandbox).toBe(true);
      expect(patch.diffSummary).toContain('- "mysql2": "^3.9.0"');
      expect(patch.diffSummary).toContain('+ "mysql2": "^3.9.7"');
      expect(patch.pullRequest).toBeDefined();
      expect(patch.pullRequest?.title).toContain('fix(security): resolve CVE-2024-21508 in mysql2');
      expect(patch.pullRequest?.branchName).toContain('fix/security-cve-2024-21508-mysql2');
      expect(prismaMock.securityPatch.create).toHaveBeenCalled();
    });

    it('should transition patch to PR_CREATED upon automated pull request creation', async () => {
      const advisory: VulnerabilityAdvisory = {
        cveId: 'CVE-2024-37890',
        packageName: 'ws',
        ecosystem: 'npm',
        vulnerableRange: '< 8.17.1',
        currentVersion: '8.16.0',
        patchedVersion: '8.17.1',
        cvssScore: 8.8,
        severity: 'HIGH',
        source: 'OSV',
        advisoryUrl: 'https://osv.dev/vulnerability/GHSA-79j7-qpx6-mpp8',
        summary: 'DoS vulnerability',
        deprecatedFunctions: ['createWebSocketStream'],
      };

      await service.synthesizeSecurityPatch(advisory);
      const prPatch = await service.createPullRequest('CVE-2024-37890');

      expect(prPatch.status).toBe('PR_CREATED');
      expect(prismaMock.securityPatch.updateMany).toHaveBeenCalledWith({
        where: { cveId: 'CVE-2024-37890' },
        data: { status: 'PR_CREATED' },
      });
    });

    it('should list synthesized patches from database or cache', async () => {
      const patches = await service.listPatches();
      expect(patches.length).toBeGreaterThan(0);
      expect(patches[0].cveId).toBe('CVE-2024-37890');
      expect(patches[0].verifiedInSandbox).toBe(true);
    });
  });
});

