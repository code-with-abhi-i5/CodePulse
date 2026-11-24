import { Injectable, Logger } from '@nestjs/common';
import { CommitErrorMatcherService, MatchCandidate } from './commit-error-matcher.service';

export interface RcaIncidentAlert {
  incidentId: string;
  detectedAt: Date;
  errorRate: number; // e.g. 15.2% error rate
  summary: string;
  culpritCommitSha?: string;
  culpritAuthor?: string;
  culpritPr?: number;
  confidenceScore?: number;
  matchedFiles?: string[];
  recommendedRevertCommand?: string;
}

@Injectable()
export class RcaCorrelatorService {
  private readonly logger = new Logger(RcaCorrelatorService.name);

  constructor(private readonly commitMatcher: CommitErrorMatcherService) {}

  /**
   * Correlates an active error spike or regression with recent git commits.
   */
  public analyzeIncident(
    errorRate: number,
    stackTrace: string,
    detectedAt = new Date(),
  ): RcaIncidentAlert {
    const candidates = this.commitMatcher.matchErrorToCommit(detectedAt, stackTrace);
    const incidentId = `rca-${Date.now()}`;

    if (candidates.length === 0) {
      return {
        incidentId,
        detectedAt,
        errorRate,
        summary: `Error spike detected (${errorRate}% 5xx error rate), but no direct git commit correlation was found within time window.`,
      };
    }

    const topCandidate = candidates[0];
    const commit = topCandidate.commit;
    const shortSha = commit.commitSha.substring(0, 7);

    const revertCmd = commit.prNumber
      ? `git revert -m 1 ${shortSha} --no-edit && git push origin main`
      : `git revert ${shortSha} --no-edit && git push origin main`;

    const alert: RcaIncidentAlert = {
      incidentId,
      detectedAt,
      errorRate,
      summary: `Root Cause Identified: Anomaly correlated with commit ${shortSha} ("${commit.message}") by @${commit.author} with ${Math.round(topCandidate.confidenceScore * 100)}% confidence.`,
      culpritCommitSha: commit.commitSha,
      culpritAuthor: commit.author,
      culpritPr: commit.prNumber,
      confidenceScore: topCandidate.confidenceScore,
      matchedFiles: topCandidate.matchedFiles,
      recommendedRevertCommand: revertCmd,
    };

    this.logger.warn(`RCA Alert [${incidentId}]: ${alert.summary}`);
    return alert;
  }
}
