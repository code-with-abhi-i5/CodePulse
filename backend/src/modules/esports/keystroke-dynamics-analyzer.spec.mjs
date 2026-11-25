import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class KeystrokeDynamicsAnalyzerService {
  analyzeKeystrokes(events) {
    if (events.length < 5) {
      return { isMacroInjected: false, confidence: 0, dwellVariance: 100, flightVariance: 100 };
    }
    const dwellTimes = [];
    const flightTimes = [];
    for (let i = 0; i < events.length; i++) {
      dwellTimes.push(events[i].releaseTime - events[i].pressTime);
      if (i > 0) flightTimes.push(events[i].pressTime - events[i - 1].releaseTime);
    }
    const dwellVariance = this.computeVariance(dwellTimes);
    const flightVariance = this.computeVariance(flightTimes);
    const isMacroInjected = dwellVariance < 2.0 && flightVariance < 2.0;
    const confidence = isMacroInjected ? 0.98 : 0.05;
    return {
      isMacroInjected,
      confidence,
      dwellVariance: parseFloat(dwellVariance.toFixed(2)),
      flightVariance: parseFloat(flightVariance.toFixed(2))
    };
  }

  computeVariance(arr) {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((acc, v) => acc + v, 0) / arr.length;
    return arr.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / arr.length;
  }
}

describe('KeystrokeDynamicsAnalyzerService', () => {
  it('detects automated macro paste with zero timing variance', () => {
    const analyzer = new KeystrokeDynamicsAnalyzerService();
    // Macro events: robotic uniform intervals
    const botEvents = [];
    for (let i = 0; i < 10; i++) {
      botEvents.push({ key: 'a', pressTime: i * 20, releaseTime: i * 20 + 10 });
    }
    const res = analyzer.analyzeKeystrokes(botEvents);
    assert.strictEqual(res.isMacroInjected, true);
    assert.ok(res.confidence > 0.9);
    assert.strictEqual(res.dwellVariance, 0);
  });

  it('permits natural human typing cadence with timing variance', () => {
    const analyzer = new KeystrokeDynamicsAnalyzerService();
    const humanEvents = [
      { key: 'c', pressTime: 0, releaseTime: 45 },
      { key: 'o', pressTime: 95, releaseTime: 130 },
      { key: 'n', pressTime: 220, releaseTime: 290 },
      { key: 's', pressTime: 360, releaseTime: 410 },
      { key: 't', pressTime: 450, releaseTime: 520 }
    ];
    const res = analyzer.analyzeKeystrokes(humanEvents);
    assert.strictEqual(res.isMacroInjected, false);
    assert.ok(res.dwellVariance > 10);
  });
});
