import { Injectable, Logger } from '@nestjs/common';
import {
  GraphTraversalService,
  DeveloperGraphNode,
  PathMatchCandidate,
} from './graph-traversal.service';

export interface MentorMatchResult {
  menteeId: string;
  matchedMentorId: string;
  mentorName: string;
  targetGoal: string;
  compatibilityScore: number; // 0..100
  sharedLanguages: string[];
  timezoneDifferenceHours: number;
  mentorProficiencyDelta: number;
  latencyMs: number;
}

@Injectable()
export class MentorMatcherService {
  private readonly logger = new Logger(MentorMatcherService.name);

  constructor(private readonly graph: GraphTraversalService) {}

  public registerStudentProfile(profile: DeveloperGraphNode): void {
    this.graph.addNode(profile);
  }

  /**
   * Finds the best mentor match for a student in < 80ms.
   */
  public matchMentee(menteeId: string, specificGoal?: string): MentorMatchResult | null {
    const start = performance.now();
    const candidates = this.graph.findOptimalMentors(menteeId, specificGoal, 1);
    const latencyMs = Number((performance.now() - start).toFixed(2));

    if (candidates.length === 0) {
      this.logger.warn(`No eligible mentor found for mentee ${menteeId}`);
      return null;
    }

    const top = candidates[0];
    // Convert Dijkstra weight distance to 0..100 compatibility score
    const compatibilityScore = Math.max(0, Math.min(100, Math.round(100 - top.weightDistance * 2)));

    // Allocate mentee capacity
    top.mentor.currentMenteesCount++;

    const result: MentorMatchResult = {
      menteeId,
      matchedMentorId: top.mentor.userId,
      mentorName: top.mentor.name,
      targetGoal: top.matchedGoal,
      compatibilityScore,
      sharedLanguages: top.sharedLanguages,
      timezoneDifferenceHours: top.timezoneDifferenceHours,
      mentorProficiencyDelta: top.skillAdvantage,
      latencyMs,
    };

    this.logger.log(
      `Mentorship paired: ${menteeId} -> ${top.mentor.name} for ${top.matchedGoal} (Score: ${compatibilityScore}%, Latency: ${latencyMs}ms)`,
    );

    return result;
  }

  /**
   * Batch matching for multiple students.
   */
  public batchMatch(menteeIds: string[]): Map<string, MentorMatchResult> {
    const results = new Map<string, MentorMatchResult>();
    for (const id of menteeIds) {
      const match = this.matchMentee(id);
      if (match) {
        results.set(id, match);
      }
    }
    return results;
  }
}
