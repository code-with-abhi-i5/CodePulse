import { Injectable, Logger } from '@nestjs/common';
import {
  SkillCompetency,
  DeveloperSkillProfile,
  SkillMatrixService,
} from './skill-matrix.service';

export interface ZpdPairMatch {
  menteeUserId: string;
  mentorUserId: string;
  competency: SkillCompetency;
  menteeProficiency: number;
  mentorProficiency: number;
  gapDelta: number;
  zpdAffinityScore: number; // 0..100
  zoneClassification: 'OPTIMAL_SCAFFOLDING' | 'STRETCH' | 'FRUSTRATION' | 'STAGNATION';
  scaffoldingGuidance: string;
}

export interface ReciprocalMentorshipPair {
  peerA: {
    userId: string;
    username: string;
    mentorsPeerBIn: SkillCompetency[];
  };
  peerB: {
    userId: string;
    username: string;
    mentorsPeerAIn: SkillCompetency[];
  };
  overallSynergyScore: number; // 0..100
  reciprocalBalanceIndex: number; // 0..1 (1 = perfectly balanced exchange)
  rationale: string;
}

export interface ZpdCompetencyEvaluation {
  gap: number;
  score: number;
  zoneClassification: ZpdPairMatch['zoneClassification'];
  guidance: string;
}

@Injectable()
export class ZpdMatcherService {
  private readonly logger = new Logger(ZpdMatcherService.name);

  // Vygotsky ZPD Delta Benchmarks:
  // Optimal learning gap is between +10 and +25 points
  public static readonly OPTIMAL_GAP_MIN = 10;
  public static readonly OPTIMAL_GAP_MAX = 25;
  public static readonly FRUSTRATION_GAP_THRESHOLD = 45;

  constructor(private readonly skillMatrix: SkillMatrixService) {}

  /**
   * Evaluates pairwise ZPD fit between a mentee and a candidate mentor for a specific competency.
   */
  public evaluateZpdCompetencyGap(
    menteeScore: number,
    mentorScore: number,
    competency: SkillCompetency,
  ): ZpdCompetencyEvaluation {
    const gap = mentorScore - menteeScore;

    if (gap < 5) {
      return {
        gap,
        score: Math.max(0, 30 + gap * 2),
        zoneClassification: 'STAGNATION' as const,
        guidance: `Insufficient expertise differential in ${competency}; minimal scaffolding opportunity.`,
      };
    }

    if (gap >= ZpdMatcherService.OPTIMAL_GAP_MIN && gap <= ZpdMatcherService.OPTIMAL_GAP_MAX) {
      // Gaussian peak at delta = 17.5
      const optimalMidpoint = 17.5;
      const deviation = Math.abs(gap - optimalMidpoint);
      const score = Math.round(100 - deviation * 2.5);

      return {
        gap,
        score,
        zoneClassification: 'OPTIMAL_SCAFFOLDING' as const,
        guidance: `Optimal Vygotsky ZPD range (+${gap} pts). Mentor can provide structured scaffolding without cognitive overload in ${competency}.`,
      };
    }

    if (gap > ZpdMatcherService.OPTIMAL_GAP_MAX && gap < ZpdMatcherService.FRUSTRATION_GAP_THRESHOLD) {
      return {
        gap,
        score: Math.round(70 - (gap - 25) * 1.5),
        zoneClassification: 'STRETCH' as const,
        guidance: `Challenging learning gap (+${gap} pts). Requires active breaking down of complex concepts in ${competency}.`,
      };
    }

    // gap >= 45: Frustration zone
    return {
      gap,
      score: Math.max(10, 40 - (gap - 45)),
      zoneClassification: 'FRUSTRATION' as const,
      guidance: `Cognitive overload risk (+${gap} pts). Expertise delta too steep; mentee may struggle to assimilate abstractions.`,
    };
  }

  /**
   * Finds reciprocal peer-mentorship matches where both students act as MKO (More Knowledgeable Other)
   * for each other across complementary axes.
   */
  public findReciprocalMentorshipPairs(
    profiles: DeveloperSkillProfile[],
    minSynergyScore = 60,
  ): ReciprocalMentorshipPair[] {
    const pairs: ReciprocalMentorshipPair[] = [];
    const n = profiles.length;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const peerA = profiles[i];
        const peerB = profiles[j];

        const aMentorsB: SkillCompetency[] = [];
        const bMentorsA: SkillCompetency[] = [];
        let totalZpdScore = 0;
        let matchedAxesCount = 0;

        for (const comp of Object.keys(peerA.scores) as SkillCompetency[]) {
          const scoreA = peerA.scores[comp];
          const scoreB = peerB.scores[comp];

          // Check if A can scaffold B
          if (scoreA > scoreB) {
            const evalResult = this.evaluateZpdCompetencyGap(scoreB, scoreA, comp);
            if (evalResult.zoneClassification === 'OPTIMAL_SCAFFOLDING' || evalResult.zoneClassification === 'STRETCH') {
              aMentorsB.push(comp);
              totalZpdScore += evalResult.score;
              matchedAxesCount++;
            }
          } else if (scoreB > scoreA) {
            // Check if B can scaffold A
            const evalResult = this.evaluateZpdCompetencyGap(scoreA, scoreB, comp);
            if (evalResult.zoneClassification === 'OPTIMAL_SCAFFOLDING' || evalResult.zoneClassification === 'STRETCH') {
              bMentorsA.push(comp);
              totalZpdScore += evalResult.score;
              matchedAxesCount++;
            }
          }
        }

        // Only pair if reciprocal (both have at least 1 dimension where they lead)
        if (aMentorsB.length > 0 && bMentorsA.length > 0) {
          const avgZpdScore = matchedAxesCount > 0 ? Math.round(totalZpdScore / matchedAxesCount) : 0;
          const minMentorshipCount = Math.min(aMentorsB.length, bMentorsA.length);
          const maxMentorshipCount = Math.max(aMentorsB.length, bMentorsA.length);
          const balanceIndex = Number((minMentorshipCount / maxMentorshipCount).toFixed(2));

          const synergy = Math.round(avgZpdScore * 0.7 + balanceIndex * 30);

          if (synergy >= minSynergyScore) {
            pairs.push({
              peerA: {
                userId: peerA.userId,
                username: peerA.username,
                mentorsPeerBIn: aMentorsB,
              },
              peerB: {
                userId: peerB.userId,
                username: peerB.username,
                mentorsPeerAIn: bMentorsA,
              },
              overallSynergyScore: synergy,
              reciprocalBalanceIndex: balanceIndex,
              rationale: `${peerA.username} guides ${peerB.username} in [${aMentorsB.join(', ')}], while ${peerB.username} guides ${peerA.username} in [${bMentorsA.join(', ')}].`,
            });
          }
        }
      }
    }

    return pairs.sort((a, b) => b.overallSynergyScore - a.overallSynergyScore);
  }
}
