import { Test, TestingModule } from '@nestjs/testing';
import { SkillMatrixService, DeveloperSkillProfile } from './skill-matrix.service';
import { ZpdMatcherService } from './zpd-matcher.service';

describe('ZpdMatcherService (Vygotsky ZPD Educational Scaffolding)', () => {
  let zpdMatcher: ZpdMatcherService;
  let skillMatrix: SkillMatrixService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SkillMatrixService, ZpdMatcherService],
    }).compile();

    skillMatrix = module.get<SkillMatrixService>(SkillMatrixService);
    zpdMatcher = module.get<ZpdMatcherService>(ZpdMatcherService);
  });

  describe('evaluateZpdCompetencyGap', () => {
    it('classifies gap in [10, 25] as OPTIMAL_SCAFFOLDING with high score', () => {
      const result = zpdMatcher.evaluateZpdCompetencyGap(50, 68, 'Algorithms');
      expect(result.zoneClassification).toBe('OPTIMAL_SCAFFOLDING');
      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.gap).toBe(18);
      expect(result.guidance).toContain('Optimal Vygotsky ZPD range');
    });

    it('classifies gap < 5 as STAGNATION with minimal scaffolding opportunity', () => {
      const result = zpdMatcher.evaluateZpdCompetencyGap(70, 72, 'Concurrency');
      expect(result.zoneClassification).toBe('STAGNATION');
      expect(result.score).toBeLessThan(40);
    });

    it('classifies gap in [26, 44] as STRETCH', () => {
      const result = zpdMatcher.evaluateZpdCompetencyGap(40, 72, 'DevOps');
      expect(result.zoneClassification).toBe('STRETCH');
      expect(result.guidance).toContain('Challenging learning gap');
    });

    it('classifies gap >= 45 as FRUSTRATION with cognitive overload risk', () => {
      const result = zpdMatcher.evaluateZpdCompetencyGap(20, 85, 'Security');
      expect(result.zoneClassification).toBe('FRUSTRATION');
      expect(result.score).toBeLessThanOrEqual(40);
      expect(result.guidance).toContain('Cognitive overload risk');
    });
  });

  describe('findReciprocalMentorshipPairs', () => {
    it('pairs peers with complementary strengths in mutual ZPD zones', () => {
      const studentA: DeveloperSkillProfile = {
        userId: 'usr_alice',
        username: 'alice',
        scores: {
          Algorithms: 80,
          Concurrency: 75,
          Frontend: 30,
          Security: 40,
          DevOps: 35,
          Cryptography: 50,
          Database: 60,
          Networking: 50,
          'Clean Code': 70,
          Performance: 65,
          Testing: 55,
          'System Design': 60,
        },
        unitVector: [],
        topCompetencies: ['Algorithms', 'Concurrency'],
        growthCompetencies: ['Frontend', 'DevOps'],
      };

      const studentB: DeveloperSkillProfile = {
        userId: 'usr_bob',
        username: 'bob',
        scores: {
          Algorithms: 62, // Alice is +18 ahead in Algorithms (ZPD optimal!)
          Concurrency: 55, // Alice is +20 ahead in Concurrency (ZPD optimal!)
          Frontend: 48, // Bob is +18 ahead in Frontend (ZPD optimal!)
          Security: 40,
          DevOps: 52, // Bob is +17 ahead in DevOps (ZPD optimal!)
          Cryptography: 50,
          Database: 60,
          Networking: 50,
          'Clean Code': 70,
          Performance: 65,
          Testing: 55,
          'System Design': 60,
        },
        unitVector: [],
        topCompetencies: ['DevOps', 'Frontend'],
        growthCompetencies: ['Algorithms', 'Concurrency'],
      };

      const pairs = zpdMatcher.findReciprocalMentorshipPairs([studentA, studentB], 50);
      expect(pairs.length).toBe(1);

      const pair = pairs[0];
      expect(pair.peerA.username).toBe('alice');
      expect(pair.peerB.username).toBe('bob');
      expect(pair.peerA.mentorsPeerBIn).toContain('Algorithms');
      expect(pair.peerB.mentorsPeerAIn).toContain('Frontend');
      expect(pair.overallSynergyScore).toBeGreaterThanOrEqual(75);
      expect(pair.reciprocalBalanceIndex).toBeGreaterThan(0.5);
    });
  });
});
