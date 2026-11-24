import { Test, TestingModule } from '@nestjs/testing';
import { GraphTraversalService, DeveloperGraphNode } from './graph-traversal.service';
import { MentorMatcherService } from './mentor-matcher.service';

describe('MentorMatcherService & GraphTraversalService', () => {
  let traversal: GraphTraversalService;
  let matcher: MentorMatcherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GraphTraversalService, MentorMatcherService],
    }).compile();

    traversal = module.get<GraphTraversalService>(GraphTraversalService);
    matcher = module.get<MentorMatcherService>(MentorMatcherService);
  });

  afterEach(() => {
    traversal.clear();
  });

  describe('Dijkstra Shortest Path Matching', () => {
    it('finds optimal mentor match balancing language, timezone, and skill goals in < 80ms', () => {
      const mentee: DeveloperGraphNode = {
        userId: 'student_1',
        name: 'Carlos',
        languages: ['English', 'Spanish'],
        timezoneOffsetHours: -5, // EST (UTC-5)
        skills: { DistributedSystems: 35, Rust: 40 },
        learningGoals: ['DistributedSystems'],
        maxMenteesCapacity: 0,
        currentMenteesCount: 0,
      };

      const perfectMentor: DeveloperGraphNode = {
        userId: 'mentor_1',
        name: 'Elena',
        languages: ['English', 'Spanish'],
        timezoneOffsetHours: -4, // UTC-4 (1 hour difference)
        skills: { DistributedSystems: 58 }, // +23 points delta (ideal ZPD)
        learningGoals: [],
        maxMenteesCapacity: 3,
        currentMenteesCount: 0,
      };

      const incompatibleTimezoneMentor: DeveloperGraphNode = {
        userId: 'mentor_2',
        name: 'Hiroshi',
        languages: ['English'],
        timezoneOffsetHours: 9, // JST (UTC+9 -> 14 hour difference, exceeds 6h threshold)
        skills: { DistributedSystems: 90 },
        learningGoals: [],
        maxMenteesCapacity: 5,
        currentMenteesCount: 0,
      };

      const noLanguageMatchMentor: DeveloperGraphNode = {
        userId: 'mentor_3',
        name: 'Hans',
        languages: ['German'], // No shared language
        timezoneOffsetHours: -5,
        skills: { DistributedSystems: 80 },
        learningGoals: [],
        maxMenteesCapacity: 5,
        currentMenteesCount: 0,
      };

      matcher.registerStudentProfile(mentee);
      matcher.registerStudentProfile(perfectMentor);
      matcher.registerStudentProfile(incompatibleTimezoneMentor);
      matcher.registerStudentProfile(noLanguageMatchMentor);

      const result = matcher.matchMentee('student_1', 'DistributedSystems');
      expect(result).not.toBeNull();
      expect(result?.matchedMentorId).toBe('mentor_1');
      expect(result?.mentorName).toBe('Elena');
      expect(result?.sharedLanguages).toContain('Spanish');
      expect(result?.timezoneDifferenceHours).toBe(1);
      expect(result?.latencyMs).toBeLessThan(80); // < 80ms benchmark
      expect(result?.compatibilityScore).toBeGreaterThan(70);

      // Verify mentor capacity incremented
      expect(perfectMentor.currentMenteesCount).toBe(1);
    });

    it('rejects mentor who has reached max mentees capacity', () => {
      const mentee: DeveloperGraphNode = {
        userId: 'mentee_a',
        name: 'Student A',
        languages: ['English'],
        timezoneOffsetHours: 0,
        skills: { Go: 20 },
        learningGoals: ['Go'],
        maxMenteesCapacity: 0,
        currentMenteesCount: 0,
      };

      const fullMentor: DeveloperGraphNode = {
        userId: 'mentor_full',
        name: 'Busy Mentor',
        languages: ['English'],
        timezoneOffsetHours: 0,
        skills: { Go: 70 },
        learningGoals: [],
        maxMenteesCapacity: 2,
        currentMenteesCount: 2, // Full capacity
      };

      matcher.registerStudentProfile(mentee);
      matcher.registerStudentProfile(fullMentor);

      const result = matcher.matchMentee('mentee_a', 'Go');
      expect(result).toBeNull();
    });
  });
});
