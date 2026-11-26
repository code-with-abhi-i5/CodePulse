import { Injectable } from '@nestjs/common';
import { KeystrokeEvent, KeystrokeAnalysis } from '../../types/esports';

@Injectable()
export class KeystrokeDynamicsAnalyzerService {
  analyzeKeystrokes(events: KeystrokeEvent[]): KeystrokeAnalysis {
    if (events.length < 5) {
      return { isMacroInjected: false, confidence: 0, dwellVariance: 100, flightVariance: 100 };
    }

    const dwellTimes: number[] = [];
    const flightTimes: number[] = [];

    for (let i = 0; i < events.length; i++) {
      dwellTimes.push(events[i].releaseTime - events[i].pressTime);
      if (i > 0) {
        flightTimes.push(events[i].pressTime - events[i - 1].releaseTime);
      }
    }

    const dwellVariance = this.computeVariance(dwellTimes);
    const flightVariance = this.computeVariance(flightTimes);

    // Bot/macro indicators: identical flight times (<5 variance) or near-zero flight times
    const isMacroInjected = dwellVariance < 2.0 && flightVariance < 2.0;
    const confidence = isMacroInjected ? 0.98 : 0.05;

    return {
      isMacroInjected,
      confidence,
      dwellVariance: parseFloat(dwellVariance.toFixed(2)),
      flightVariance: parseFloat(flightVariance.toFixed(2))
    };
  }

  private computeVariance(arr: number[]): number {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((acc, v) => acc + v, 0) / arr.length;
    return arr.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / arr.length;
  }
}
