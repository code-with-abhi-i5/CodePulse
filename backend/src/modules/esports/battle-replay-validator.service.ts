import { Injectable } from '@nestjs/common';
import { BattleEvent, ReplayValidationResult } from '../../types/esports';

@Injectable()
export class BattleReplayValidatorService {
  validateReplay(events: BattleEvent[], expectedWinner: string): ReplayValidationResult {
    let rollingHash = 0;
    const discrepancies: string[] = [];

    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      if (e.step !== i + 1) {
        discrepancies.push(`Step mismatch at index ${i}: expected ${i + 1}, got ${e.step}`);
      }
      for (let j = 0; j < e.action.length; j++) {
        rollingHash = (rollingHash * 31 + e.action.charCodeAt(j)) | 0;
      }
    }

    const computedWinner = events.length > 0 && events[events.length - 1].action.includes('winner=')
      ? events[events.length - 1].action.split('winner=')[1]
      : expectedWinner;

    const isValid = discrepancies.length === 0 && computedWinner === expectedWinner;

    return {
      isValid,
      computedWinner,
      finalHash: Math.abs(rollingHash).toString(16),
      discrepancies
    };
  }
}
