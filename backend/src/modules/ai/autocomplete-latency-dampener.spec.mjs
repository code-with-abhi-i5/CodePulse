import test from 'node:test';
import assert from 'node:assert/strict';

class AutocompleteLatencyDampener {
  constructor(threshold = 60) {
    this.typingSpeedThresholdWpm = threshold;
  }

  evaluateKeystroke(charCount, elapsedMinutes, pauseDurationMs) {
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

test('AutocompleteLatencyDampener - throttles completion requests during fast typing', () => {
  const dampener = new AutocompleteLatencyDampener(60);

  // Fast typing (80 WPM with 50ms pause)
  const throttled = dampener.evaluateKeystroke(400, 1.0, 50);
  assert.strictEqual(throttled.shouldCallLlm, false);
  assert.strictEqual(throttled.wpm, 80);

  // Natural pause (300ms pause)
  const allowed = dampener.evaluateKeystroke(400, 1.0, 300);
  assert.strictEqual(allowed.shouldCallLlm, true);
});
