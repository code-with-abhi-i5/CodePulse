import { Test, TestingModule } from '@nestjs/testing';
import { CognitiveFatigueService, KeystrokeTelemetrySample } from './cognitive-fatigue.service';

describe('CognitiveFatigueService', () => {
  let service: CognitiveFatigueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CognitiveFatigueService],
    }).compile();

    service = module.get<CognitiveFatigueService>(CognitiveFatigueService);
  });

  describe('Flow State and Fluid Typing', () => {
    it('rates consistent, rhythmic typing with low backspace ratio as FLUID flow state', () => {
      const now = Date.now();
      const fluidSamples: KeystrokeTelemetrySample[] = Array.from({ length: 50 }).map((_, i) => ({
        timestamp: now + i * 150,
        interKeyIntervalMs: 140 + (i % 5) * 5, // Tight 140-160ms interval (low variance)
        isBackspaceOrDelete: i === 25, // Only 1 backspace out of 50 = 2%
        contextSwitchCount: 0,
        compileErrorOccurred: false,
      }));

      const assessment = service.analyzeSession('sess_fluid', fluidSamples, now);
      expect(assessment.fluidityRating).toBe('FLUID');
      expect(assessment.fatigueIndexPct).toBeLessThan(25);
      expect(assessment.flowStateScore).toBeGreaterThan(75);
      expect(assessment.isHighRiskBugWindow).toBe(false);
      expect(assessment.warningMessage).toBeUndefined();
    });
  });

  describe('Cognitive Fatigue and Bug Insertion Window Detection', () => {
    it('warns when fatigue index spikes > 80% with high IKI jitter and compile errors', () => {
      const now = Date.now();
      const exhaustedSamples: KeystrokeTelemetrySample[] = Array.from({ length: 50 }).map((_, i) => ({
        timestamp: now + i * 800,
        interKeyIntervalMs: i % 2 === 0 ? 50 : 1800, // Massive variance / hesitation
        isBackspaceOrDelete: i % 3 === 0, // High backspace churn (~33%)
        contextSwitchCount: 2, // Rapid tab switching
        compileErrorOccurred: i % 10 === 0, // Repeated compile errors
      }));

      const assessment = service.analyzeSession('sess_exhausted', exhaustedSamples, now);
      expect(assessment.fatigueIndexPct).toBeGreaterThanOrEqual(80);
      expect(assessment.fluidityRating).toBe('EXHAUSTED');
      expect(assessment.isHighRiskBugWindow).toBe(true);
      expect(assessment.warningMessage).toContain('High cognitive fatigue detected');
      expect(assessment.warningMessage).toContain('high-risk bug insertion');
    });

    it('handles empty session gracefully', () => {
      const empty = service.analyzeSession('sess_empty', []);
      expect(empty.fatigueIndexPct).toBe(0);
      expect(empty.isHighRiskBugWindow).toBe(false);
    });
  });
});
