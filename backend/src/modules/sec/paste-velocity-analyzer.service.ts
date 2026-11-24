import { Injectable, Logger } from '@nestjs/common';

export interface InsertionEvent {
  timestamp: number; // Unix ms
  charCount: number;
  textSnippet?: string;
  sourceType: 'INPUT' | 'PASTE' | 'AUTOCOMPLETE' | 'UNKNOWN';
}

export interface VelocityAnalysisResult {
  velocityWpm: number;
  isVelocityAnomaly: boolean;
  isLegitimateAutocomplete: boolean;
  anomalyScore: number; // 0..100
  reason?: string;
}

@Injectable()
export class PasteVelocityAnalyzerService {
  private readonly logger = new Logger(PasteVelocityAnalyzerService.name);

  // Benchmarks: human typing rarely exceeds 200 WPM; bursts > 300 WPM flag anomaly
  public static readonly BURST_WPM_THRESHOLD = 300;
  public static readonly MAX_AUTOCOMPLETE_CHAR_LENGTH = 70;

  /**
   * Calculates typing velocity in Words-Per-Minute (WPM).
   * Standard metric: 1 word = 5 characters.
   */
  public calculateWpm(charCount: number, durationMs: number): number {
    if (durationMs <= 0 || charCount <= 0) return 0;
    const minutes = durationMs / 60000;
    const words = charCount / 5;
    return Math.round(words / minutes);
  }

  /**
   * Evaluates whether an insertion burst is legitimate IDE autocomplete
   * (e.g. bracket auto-close, keyword import, short snippet) vs an external paste.
   */
  public evaluateInsertionBurst(
    event: InsertionEvent,
    elapsedSinceLastKeyMs: number,
  ): VelocityAnalysisResult {
    const chars = event.charCount;

    // 1. Single character or tiny delta is standard human typing
    if (chars <= 3) {
      return {
        velocityWpm: 80,
        isVelocityAnomaly: false,
        isLegitimateAutocomplete: false,
        anomalyScore: 0,
      };
    }

    // 2. Legitimate IDE Autocomplete heuristic:
    // - Short length (< 70 chars, e.g. "console.log();" or closing braces)
    // - Inserted directly following a keypress (elapsed < 80ms)
    // - Source tagged as AUTOCOMPLETE or contains standard bracket/import pattern
    const isShort = chars <= PasteVelocityAnalyzerService.MAX_AUTOCOMPLETE_CHAR_LENGTH;
    const isImmediate = elapsedSinceLastKeyMs <= 100;
    const looksLikeSnippet = event.textSnippet
      ? /^[{}[\]()<>'"`;\s]+$/.test(event.textSnippet) ||
        /^(?:import|export|const|function|return)\s+\w+/.test(event.textSnippet.trim())
      : false;

    if (isShort && (isImmediate || looksLikeSnippet || event.sourceType === 'AUTOCOMPLETE')) {
      return {
        velocityWpm: 150,
        isVelocityAnomaly: false,
        isLegitimateAutocomplete: true,
        anomalyScore: 5,
        reason: 'Legitimate editor autocomplete or snippet expansion',
      };
    }

    // 3. Paste Event or Instant Large Insertion (e.g. >100 chars in < 20ms)
    // Compute effective WPM for the burst
    const effectiveDurationMs = Math.max(10, elapsedSinceLastKeyMs);
    const burstWpm = this.calculateWpm(chars, effectiveDurationMs);

    const isAnomaly =
      event.sourceType === 'PASTE' ||
      chars > 120 ||
      burstWpm > PasteVelocityAnalyzerService.BURST_WPM_THRESHOLD;

    const anomalyScore = Math.min(
      100,
      Math.round(
        (chars > 200 ? 50 : 25) +
        (event.sourceType === 'PASTE' ? 40 : 0) +
        Math.min(30, (burstWpm / 1000) * 15),
      ),
    );

    return {
      velocityWpm: burstWpm,
      isVelocityAnomaly: isAnomaly,
      isLegitimateAutocomplete: false,
      anomalyScore,
      reason: isAnomaly
        ? `Abnormal insertion burst: ${chars} characters (${burstWpm} WPM)`
        : undefined,
    };
  }
}
