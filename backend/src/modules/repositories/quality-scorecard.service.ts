import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GitTreeNode } from './git-tree.service';

export interface EvaluatedScorecard {
  overallScore: number;
  grade: string;
  documentationScore: number;
  testingScore: number;
  ciCdScore: number;
  maintenanceScore: number;
  hasLicense: boolean;
  hasCi: boolean;
  testFramework?: string | null;
  evaluatedAt: Date;
}

@Injectable()
export class QualityScorecardService {
  private readonly logger = new Logger(QualityScorecardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluates repository code quality, architecture rigor, and test coverage based on tree nodes.
   */
  async evaluateRepositoryQuality(
    repositoryId: string,
    treeNodes: GitTreeNode[],
    commitsCount = 0,
    openIssuesCount = 0,
  ): Promise<EvaluatedScorecard> {
    const paths = new Set(treeNodes.map((n) => n.path.toLowerCase()));

    // 1. Documentation Score (max 25)
    let docScore = 0;
    const hasReadme = treeNodes.some(
      (n) => n.path.toLowerCase() === 'readme.md' && (n.size ?? 1000) > 200,
    );
    if (hasReadme) docScore += 15;

    const hasLicense = paths.has('license') || paths.has('license.md') || paths.has('license.txt');
    if (hasLicense) docScore += 5;

    const hasContributing =
      paths.has('contributing.md') ||
      paths.has('.github/contributing.md') ||
      paths.has('code_of_conduct.md');
    if (hasContributing) docScore += 5;

    // 2. Testing Rigor Score (max 35)
    let testingScore = 0;
    let testFramework: string | null = null;

    const testFiles = treeNodes.filter((n) => {
      const p = n.path.toLowerCase();
      return (
        p.includes('.spec.') ||
        p.includes('.test.') ||
        p.startsWith('test/') ||
        p.startsWith('tests/') ||
        p.startsWith('__tests__/')
      );
    });

    if (testFiles.length > 0) {
      testingScore += Math.min(25, testFiles.length * 5); // up to 25 pts for test files
    }

    if (paths.has('jest.config.js') || paths.has('jest.config.ts')) {
      testFramework = 'Jest';
      testingScore += 10;
    } else if (paths.has('vitest.config.ts') || paths.has('vite.config.ts')) {
      testFramework = 'Vitest';
      testingScore += 10;
    } else if (paths.has('pytest.ini') || paths.has('tests/test_') || paths.has('conftest.py')) {
      testFramework = 'Pytest';
      testingScore += 10;
    } else if (testFiles.length > 0) {
      testFramework = 'Standard Test Suite';
      testingScore += 5;
    }

    testingScore = Math.min(35, testingScore);

    // 3. CI/CD Automation Score (max 20)
    let ciCdScore = 0;
    const hasCi = treeNodes.some(
      (n) =>
        n.path.toLowerCase().startsWith('.github/workflows/') ||
        n.path.toLowerCase() === '.travis.yml' ||
        n.path.toLowerCase() === 'circleci/config.yml' ||
        n.path.toLowerCase() === '.gitlab-ci.yml',
    );
    if (hasCi) ciCdScore = 20;

    // 4. Maintenance & Velocity Score (max 20)
    let maintenanceScore = 10; // baseline
    if (commitsCount > 50) maintenanceScore += 5;
    if (commitsCount > 200) maintenanceScore += 5;
    if (openIssuesCount > 50) maintenanceScore = Math.max(5, maintenanceScore - 5);

    const overallScore = Math.round(docScore + testingScore + ciCdScore + maintenanceScore);
    const grade = this.computeGrade(overallScore);

    const scorecardRecord = await this.prisma.repositoryQualityScorecard.upsert({
      where: { repositoryId },
      create: {
        repositoryId,
        overallScore,
        grade,
        documentationScore: docScore,
        testingScore,
        ciCdScore,
        maintenanceScore,
        hasLicense,
        hasCi,
        testFramework,
        evaluatedAt: new Date(),
      },
      update: {
        overallScore,
        grade,
        documentationScore: docScore,
        testingScore,
        ciCdScore,
        maintenanceScore,
        hasLicense,
        hasCi,
        testFramework,
        evaluatedAt: new Date(),
      },
    });

    return {
      overallScore: scorecardRecord.overallScore,
      grade: scorecardRecord.grade,
      documentationScore: scorecardRecord.documentationScore,
      testingScore: scorecardRecord.testingScore,
      ciCdScore: scorecardRecord.ciCdScore,
      maintenanceScore: scorecardRecord.maintenanceScore,
      hasLicense: scorecardRecord.hasLicense,
      hasCi: scorecardRecord.hasCi,
      testFramework: scorecardRecord.testFramework,
      evaluatedAt: scorecardRecord.evaluatedAt,
    };
  }

  async getScorecard(repositoryId: string) {
    return this.prisma.repositoryQualityScorecard.findUnique({
      where: { repositoryId },
    });
  }

  private computeGrade(score: number): string {
    if (score >= 95) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }
}
