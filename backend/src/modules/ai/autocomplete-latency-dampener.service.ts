import { AutocompleteThrottlingDecision } from '../../types/ai';

export class AutocompleteLatencyDampener {
  private lastKeystrokeTime: number = 0;
  private readonly typingSpeedThresholdWpm: number = 60;

  evaluateKeystroke(charCount: number, elapsedMinutes: number, pauseDurationMs: number): AutocompleteThrottlingDecision {
    const wpm = elapsedMinutes > 0 ? Math.round((charCount / 5) / elapsedMinutes) : 0;

    if (wpm > this.typingSpeedThresholdWpm && pauseDurationMs < 250) {
      return {
        shouldCallLlm: false,
        wpm,
        delayMs: 250 - pauseDurationMs,
        reason: 'User is typing rapidly; throttling LLM completion call'
      };
    }

    return {
      shouldCallLlm: true,
      wpm,
      delayMs: 0,
      reason: 'Typing pause detected; allowed autocomplete call'
    };
  }
}
