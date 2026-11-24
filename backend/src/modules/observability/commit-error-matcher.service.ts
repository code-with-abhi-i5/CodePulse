import { Injectable, Logger } from '@nestjs/common';

export interface DeploymentCommit {
  commitSha: string;
  prNumber?: number;
  author: string;
  authorEmail?: string;
  message: string;
  deployedAt: Date;
  changedFiles: string[];
}

export interface MatchCandidate {
  commit: DeploymentCommit;
  confidenceScore: number; // 0.0 to 1.0
  matchedFiles: string[];
  timeDeltaSec: number;
}

@Injectable()
export class CommitErrorMatcherService {
  private readonly logger = new Logger(CommitErrorMatcherService.name);
  private readonly deploymentHistory: DeploymentCommit[] = [];

  /**
   * Registers a git deployment / release event.
   */
  public registerDeployment(commit: DeploymentCommit): void {
    this.deploymentHistory.push(commit);
    this.logger.log(`Registered deployment for commit ${commit.commitSha.substring(0, 7)} by ${commit.author}`);
  }

  /**
   * Extracts referenced file paths from an error stack trace.
   */
  public extractFilesFromStackTrace(stack: string): string[] {
    const fileMatches = stack.match(/([a-zA-Z0-9_\-\.\/]+\.(ts|js|jsx|tsx))/g) || [];
    return Array.from(new Set(fileMatches));
  }

  /**
   * Matches an error spike to recent deployment commits based on file overlaps and deployment timestamps.
   */
  public matchErrorToCommit(
    errorTimestamp: Date,
    stackTrace: string,
    maxTimeWindowSec = 1800, // 30 minutes
  ): MatchCandidate[] {
    const errorFiles = this.extractFilesFromStackTrace(stackTrace);
    const candidates: MatchCandidate[] = [];

    for (const commit of this.deploymentHistory) {
      const timeDeltaSec = (errorTimestamp.getTime() - commit.deployedAt.getTime()) / 1000;

      // Anomaly must occur at or shortly after deployment
      if (timeDeltaSec < 0 || timeDeltaSec > maxTimeWindowSec) {
        continue;
      }

      // Check file path intersections
      const matchedFiles: string[] = [];
      for (const ef of errorFiles) {
        const efNorm = ef.replace(/\\/g, '/');
        for (const cf of commit.changedFiles) {
          const cfNorm = cf.replace(/\\/g, '/');
          if (cfNorm.endsWith(efNorm) || efNorm.endsWith(cfNorm)) {
            matchedFiles.push(cf);
          }
        }
      }

      if (matchedFiles.length > 0) {
        // High confidence if files directly match in stack trace
        const fileScore = Math.min(0.6, matchedFiles.length * 0.3);
        const timeDecayScore = Math.max(0.1, 0.4 * (1 - timeDeltaSec / maxTimeWindowSec));
        const confidenceScore = Number((fileScore + timeDecayScore).toFixed(2));

        candidates.push({
          commit,
          confidenceScore,
          matchedFiles,
          timeDeltaSec: Math.round(timeDeltaSec),
        });
      }
    }

    return candidates.sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  public getHistory(): DeploymentCommit[] {
    return [...this.deploymentHistory];
  }
}
