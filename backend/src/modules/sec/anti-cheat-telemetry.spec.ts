import { Test, TestingModule } from '@nestjs/testing';
import { PasteVelocityAnalyzerService } from './paste-velocity-analyzer.service';
import { AntiCheatTelemetryService, TelemetryEvent } from './anti-cheat-telemetry.service';

describe('AntiCheatTelemetryService & PasteVelocityAnalyzerService', () => {
  let analyzer: PasteVelocityAnalyzerService;
  let antiCheat: AntiCheatTelemetryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasteVelocityAnalyzerService, AntiCheatTelemetryService],
    }).compile();

    analyzer = module.get<PasteVelocityAnalyzerService>(PasteVelocityAnalyzerService);
    antiCheat = module.get<AntiCheatTelemetryService>(AntiCheatTelemetryService);
  });

  afterEach(() => {
    antiCheat.reset();
  });

  describe('Legitimate Typing & IDE Autocomplete', () => {
    it('does NOT flag standard human typing (1-3 chars/burst, ~80 WPM)', () => {
      const now = 1000000;
      antiCheat.initSession('sess_legit', 'user_1');

      // 10 human keystrokes with 150ms intervals
      for (let i = 0; i < 10; i++) {
        const res = antiCheat.ingestTelemetryEvent('sess_legit', 'user_1', {
          type: 'KEYSTROKE',
          timestamp: now + i * 150,
          charCount: 1,
        });
        expect(res.cheatingDetected).toBe(false);
        expect(res.riskScore).toBeLessThan(20);
      }
    });

    it('does NOT false-flag legitimate editor autocomplete and bracket closure', () => {
      const res = analyzer.evaluateInsertionBurst(
        {
          timestamp: 1000000,
          charCount: 18,
          textSnippet: 'console.log(item);',
          sourceType: 'AUTOCOMPLETE',
        },
        50, // 50ms after typing 'c'
      );

      expect(res.isLegitimateAutocomplete).toBe(true);
      expect(res.isVelocityAnomaly).toBe(false);
      expect(res.anomalyScore).toBeLessThanOrEqual(10);
    });
  });

  describe('LLM Copy-Paste Cheating & Tab Blur Detection', () => {
    it('flags massive external copy-paste without predecessor keypresses (> 300 WPM)', () => {
      const now = 1000000;
      const pasteEvent: TelemetryEvent = {
        type: 'PASTE',
        timestamp: now,
        charCount: 450, // 450 chars pasted in one instant
        textSnippet: 'function dijkstra(graph, start) { const distances = {}; ... }',
      };

      const res = antiCheat.ingestTelemetryEvent('sess_cheat', 'cheater_1', pasteEvent);
      expect(res.isAnomaly).toBe(true);
      expect(res.riskScore).toBeGreaterThanOrEqual(75);
      expect(res.cheatingDetected).toBe(true);

      const state = antiCheat.getSessionState('sess_cheat');
      expect(state?.isFlaggedCheater).toBe(true);
      expect(state?.cumulativePastedChars).toBe(450);
    });

    it('detects ChatGPT copy-paste pattern: Tab blur for 10s followed by immediate 200-char injection', () => {
      const t0 = 1000000;
      const sessionId = 'sess_llm';
      const userId = 'llm_user';
      antiCheat.initSession(sessionId, userId);

      // 1. User switches tabs to browser / ChatGPT
      antiCheat.ingestTelemetryEvent(sessionId, userId, {
        type: 'TAB_BLUR',
        timestamp: t0,
      });

      // 2. User refocuses CodePulse IDE 12 seconds later
      antiCheat.ingestTelemetryEvent(sessionId, userId, {
        type: 'TAB_FOCUS',
        timestamp: t0 + 12000,
      });

      // 3. Immediately injects 250 characters
      const cheatResult = antiCheat.ingestTelemetryEvent(sessionId, userId, {
        type: 'KEYSTROKE',
        timestamp: t0 + 12500,
        charCount: 250,
        textSnippet: 'class Solution: def solve(self, nums: List[int]) -> int:',
      });

      expect(cheatResult.cheatingDetected).toBe(true);
      expect(cheatResult.riskScore).toBeGreaterThanOrEqual(80);

      const state = antiCheat.getSessionState(sessionId);
      expect(state?.isFlaggedCheater).toBe(true);
      expect(state?.infractionDetails.length).toBeGreaterThan(0);
      expect(state?.infractionDetails[0]).toContain('External LLM injection suspected');
    });
  });
});
