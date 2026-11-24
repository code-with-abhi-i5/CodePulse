import { Injectable, Logger } from '@nestjs/common';
import { PasteVelocityAnalyzerService, InsertionEvent } from './paste-velocity-analyzer.service';

export interface TelemetryEvent {
  type: 'KEYSTROKE' | 'PASTE' | 'TAB_BLUR' | 'TAB_FOCUS' | 'SELECTION';
  timestamp: number;
  charCount?: number;
  textSnippet?: string;
  sourceType?: InsertionEvent['sourceType'];
}

export interface SessionAntiCheatState {
  sessionId: string;
  userId: string;
  lastKeystrokeTime: number;
  lastTabBlurTime: number | null;
  lastTabBlurDurationMs: number;
  cumulativePastedChars: number;
  totalKeystrokes: number;
  flaggedIncidentsCount: number;
  maxCheatRiskScore: number;
  isFlaggedCheater: boolean;
  infractionDetails: string[];
}

export interface TelemetryEvaluationResult {
  actionAllowed: boolean;
  riskScore: number; // 0..100
  isAnomaly: boolean;
  cheatingDetected: boolean;
  reason?: string;
}

@Injectable()
export class AntiCheatTelemetryService {
  private readonly logger = new Logger(AntiCheatTelemetryService.name);

  // Active tracking state per session
  private readonly sessionStates = new Map<string, SessionAntiCheatState>();

  // Threshold: Risk score >= 75 flags participant for manual/automated cheating review
  public static readonly CHEATING_FLAG_THRESHOLD = 75;

  constructor(private readonly pasteAnalyzer: PasteVelocityAnalyzerService) {}

  public initSession(sessionId: string, userId: string): SessionAntiCheatState {
    const state: SessionAntiCheatState = {
      sessionId,
      userId,
      lastKeystrokeTime: Date.now(),
      lastTabBlurTime: null,
      lastTabBlurDurationMs: 0,
      cumulativePastedChars: 0,
      totalKeystrokes: 0,
      flaggedIncidentsCount: 0,
      maxCheatRiskScore: 0,
      isFlaggedCheater: false,
      infractionDetails: [],
    };
    this.sessionStates.set(sessionId, state);
    return state;
  }

  public getSessionState(sessionId: string): SessionAntiCheatState | undefined {
    return this.sessionStates.get(sessionId);
  }

  /**
   * Ingests and processes a real-time interaction event.
   */
  public ingestTelemetryEvent(
    sessionId: string,
    userId: string,
    event: TelemetryEvent,
  ): TelemetryEvaluationResult {
    let state = this.sessionStates.get(sessionId);
    if (!state) {
      state = this.initSession(sessionId, userId);
    }

    const now = event.timestamp || Date.now();

    // 1. Handle Window / Tab Blur & Focus
    if (event.type === 'TAB_BLUR') {
      state.lastTabBlurTime = now;
      this.logger.debug(`Session ${sessionId}: Browser tab blurred (switched windows)`);
      return { actionAllowed: true, riskScore: 0, isAnomaly: false, cheatingDetected: false };
    }

    if (event.type === 'TAB_FOCUS') {
      if (state.lastTabBlurTime) {
        state.lastTabBlurDurationMs = now - state.lastTabBlurTime;
      }
      this.logger.debug(`Session ${sessionId}: Browser tab focused after ${state.lastTabBlurDurationMs}ms`);
      return { actionAllowed: true, riskScore: 0, isAnomaly: false, cheatingDetected: false };
    }

    // 2. Handle Keystrokes & Insertions
    if (event.type === 'KEYSTROKE' || event.type === 'PASTE') {
      state.totalKeystrokes++;
      const charCount = event.charCount ?? 1;
      const elapsedSinceLastKey = Math.max(5, now - state.lastKeystrokeTime);
      state.lastKeystrokeTime = now;

      // Analyze velocity
      const velocityResult = this.pasteAnalyzer.evaluateInsertionBurst(
        {
          timestamp: now,
          charCount,
          textSnippet: event.textSnippet,
          sourceType: event.type === 'PASTE' ? 'PASTE' : (event.sourceType || 'INPUT'),
        },
        elapsedSinceLastKey,
      );

      // Legitimate IDE Autocomplete bypass
      if (velocityResult.isLegitimateAutocomplete) {
        return {
          actionAllowed: true,
          riskScore: velocityResult.anomalyScore,
          isAnomaly: false,
          cheatingDetected: false,
        };
      }

      let riskScore = velocityResult.anomalyScore;

      // LLM External Tab Blur Correlation:
      // If user blurred tab for >= 4 seconds (consulting external LLM) and returns
      // with a large insertion (> 100 characters within 1.5s of refocusing):
      const wasRecentlyBlurred = state.lastTabBlurDurationMs >= 4000;
      if (wasRecentlyBlurred && charCount >= 80) {
        riskScore = Math.min(100, riskScore + 45); // Heavy multiplier for LLM tab-switching paste
        const infraction = `External LLM injection suspected: Tab blurred for ${(state.lastTabBlurDurationMs / 1000).toFixed(1)}s followed by ${charCount}-character injection.`;
        state.infractionDetails.push(infraction);
        this.logger.warn(`[CHEAT DETECTED] Session ${sessionId}: ${infraction}`);
      }

      if (event.type === 'PASTE') {
        state.cumulativePastedChars += charCount;
      }

      state.maxCheatRiskScore = Math.max(state.maxCheatRiskScore, riskScore);

      const cheatingDetected = riskScore >= AntiCheatTelemetryService.CHEATING_FLAG_THRESHOLD;
      if (cheatingDetected) {
        state.flaggedIncidentsCount++;
        state.isFlaggedCheater = true;
      }

      return {
        actionAllowed: true,
        riskScore,
        isAnomaly: velocityResult.isVelocityAnomaly,
        cheatingDetected,
        reason: velocityResult.reason,
      };
    }

    return { actionAllowed: true, riskScore: 0, isAnomaly: false, cheatingDetected: false };
  }

  public reset(sessionId?: string): void {
    if (sessionId) {
      this.sessionStates.delete(sessionId);
    } else {
      this.sessionStates.clear();
    }
  }
}
