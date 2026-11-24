import { Injectable, Logger } from '@nestjs/common';

export interface KeystrokeTelemetrySample {
  timestamp: number; // Unix ms
  interKeyIntervalMs: number; // Duration between successive key presses
  isBackspaceOrDelete: boolean;
  contextSwitchCount: number; // Alt-tab / IDE blur events
  compileErrorOccurred: boolean;
}

export interface CognitiveFatigueAssessment {
  sessionId: string;
  fatigueIndexPct: number; // 0..100%
  flowStateScore: number;  // 0..100
  isHighRiskBugWindow: boolean;
  fluidityRating: 'FLUID' | 'STABLE' | 'DEGRADED' | 'EXHAUSTED';
  metrics: {
    meanIkiMs: number;
    ikiVarianceMs2: number;
    backspaceRatioPct: number;
    rapidCompileErrorLoops: number;
    contextSwitchesPerHour: number;
  };
  warningMessage?: string;
  assessedAt: Date;
}

@Injectable()
export class CognitiveFatigueService {
  private readonly logger = new Logger(CognitiveFatigueService.name);

  // Critical Fatigue Warning Threshold: > 80% fatigue triggers bug risk alerts
  public static readonly FATIGUE_WARNING_THRESHOLD_PCT = 80;

  /**
   * Evaluates a sliding window of developer interaction telemetry
   * to compute an objective Cognitive Fatigue & Flow State Index.
   */
  public analyzeSession(
    sessionId: string,
    samples: KeystrokeTelemetrySample[],
    now = Date.now(),
  ): CognitiveFatigueAssessment {
    if (!samples || samples.length === 0) {
      return {
        sessionId,
        fatigueIndexPct: 0,
        flowStateScore: 50,
        isHighRiskBugWindow: false,
        fluidityRating: 'STABLE',
        metrics: {
          meanIkiMs: 0,
          ikiVarianceMs2: 0,
          backspaceRatioPct: 0,
          rapidCompileErrorLoops: 0,
          contextSwitchesPerHour: 0,
        },
        assessedAt: new Date(now),
      };
    }

    const n = samples.length;
    const ikis = samples.map((s) => Math.min(5000, Math.max(10, s.interKeyIntervalMs)));
    const meanIki = ikis.reduce((a, b) => a + b, 0) / n;

    // Variance of inter-key intervals (high jitter indicates stuttering / cognitive pause)
    const ikiVariance = ikis.reduce((acc, v) => acc + (v - meanIki) ** 2, 0) / n;

    // Backspace delete ratio
    const backspaceCount = samples.filter((s) => s.isBackspaceOrDelete).length;
    const backspaceRatio = (backspaceCount / n) * 100;

    // Compile error loops
    const compileErrors = samples.filter((s) => s.compileErrorOccurred).length;

    // Context switches
    const totalContextSwitches = samples.reduce((sum, s) => sum + s.contextSwitchCount, 0);
    const durationHours = Math.max(0.05, (samples[n - 1].timestamp - samples[0].timestamp) / 3600000);
    const contextSwitchesPerHour = Math.round(totalContextSwitches / durationHours);

    // Compute Fatigue Factors:
    // 1. High IKI jitter / slow typing: up to 35 pts
    const jitterFactor = Math.min(35, (ikiVariance / 25000) * 35);
    // 2. High backspace ratio (>18% indicates thrashing): up to 30 pts
    const backspaceFactor = Math.min(30, (backspaceRatio / 25) * 30);
    // 3. Frantic compile error loops: up to 20 pts
    const errorFactor = Math.min(20, compileErrors * 4);
    // 4. Distracted context switching: up to 15 pts
    const switchFactor = Math.min(15, (contextSwitchesPerHour / 40) * 15);

    const rawFatigue = jitterFactor + backspaceFactor + errorFactor + switchFactor;
    const fatigueIndexPct = Math.round(Math.min(100, Math.max(0, rawFatigue)));

    // Flow State Score: inverse of fatigue with bonus for rhythmic typing (low variance, low errors)
    const flowStateScore = Math.round(Math.max(0, 100 - fatigueIndexPct * 0.9));

    const isHighRiskBugWindow = fatigueIndexPct >= CognitiveFatigueService.FATIGUE_WARNING_THRESHOLD_PCT;

    let fluidityRating: CognitiveFatigueAssessment['fluidityRating'] = 'FLUID';
    if (fatigueIndexPct >= 80) {
      fluidityRating = 'EXHAUSTED';
    } else if (fatigueIndexPct >= 55) {
      fluidityRating = 'DEGRADED';
    } else if (fatigueIndexPct >= 30) {
      fluidityRating = 'STABLE';
    } else {
      fluidityRating = 'FLUID';
    }

    let warningMessage: string | undefined;
    if (isHighRiskBugWindow) {
      warningMessage = `High cognitive fatigue detected (${fatigueIndexPct}%). Keystroke stutter, high backspace churn (${backspaceRatio.toFixed(1)}%), and compile error frequency strongly correlate with high-risk bug insertion windows. Consider taking a 15-minute break.`;
      this.logger.warn(`[FATIGUE WATCHDOG] Session ${sessionId}: ${warningMessage}`);
    }

    return {
      sessionId,
      fatigueIndexPct,
      flowStateScore,
      isHighRiskBugWindow,
      fluidityRating,
      metrics: {
        meanIkiMs: Math.round(meanIki),
        ikiVarianceMs2: Math.round(ikiVariance),
        backspaceRatioPct: Number(backspaceRatio.toFixed(2)),
        rapidCompileErrorLoops: compileErrors,
        contextSwitchesPerHour,
      },
      warningMessage,
      assessedAt: new Date(now),
    };
  }
}
