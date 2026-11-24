import { Test, TestingModule } from '@nestjs/testing';
import { DependencyGraphService, SourceFileNode } from './dependency-graph.service';

describe('DependencyGraphService', () => {
  let service: DependencyGraphService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DependencyGraphService],
    }).compile();

    service = module.get<DependencyGraphService>(DependencyGraphService);
  });

  describe('buildGraph & Metrics', () => {
    it('constructs adjacency maps and computes Fan-In, Fan-Out, and Instability metrics', () => {
      const files: SourceFileNode[] = [
        {
          filePath: 'src/services/user.service.ts',
          content: `
            import { DbService } from './db.service';
            import { Logger } from '../utils/logger';
            export class UserService {}
          `,
        },
        {
          filePath: 'src/services/db.service.ts',
          content: `
            import { Logger } from '../utils/logger';
            export class DbService {}
          `,
        },
        {
          filePath: 'src/utils/logger.ts',
          content: `
            export class Logger {}
          `,
        },
      ];

      const graph = service.buildGraph(files);
      expect(graph.nodes.length).toBe(3);
      expect(graph.edges.length).toBe(3);

      // Logger has 2 incoming dependencies (Fan-In = 2, Fan-Out = 0 -> Instability = 0.0)
      const loggerMetrics = graph.metrics.get('src/utils/logger.ts');
      expect(loggerMetrics?.fanIn).toBe(2);
      expect(loggerMetrics?.fanOut).toBe(0);
      expect(loggerMetrics?.instability).toBe(0.0);

      // UserService has 2 outgoing dependencies (Fan-In = 0, Fan-Out = 2 -> Instability = 1.0)
      const userMetrics = graph.metrics.get('src/services/user.service.ts');
      expect(userMetrics?.fanIn).toBe(0);
      expect(userMetrics?.fanOut).toBe(2);
      expect(userMetrics?.instability).toBe(1.0);
    });
  });

  describe('topologicalSort & Cycle Detection', () => {
    it('returns valid topological sort for acyclic DAG', () => {
      const files: SourceFileNode[] = [
        {
          filePath: 'src/controller.ts',
          content: `import { Service } from './service';`,
        },
        {
          filePath: 'src/service.ts',
          content: `import { Repository } from './repository';`,
        },
        {
          filePath: 'src/repository.ts',
          content: `export class Repository {}`,
        },
      ];

      const graph = service.buildGraph(files);
      const sorted = service.topologicalSort(graph);

      expect(sorted).not.toBeNull();
      expect(sorted?.length).toBe(3);
      // Repository must appear before service, and service before controller
      expect(sorted?.indexOf('src/repository.ts')).toBeLessThan(sorted?.indexOf('src/service.ts')!);
      expect(sorted?.indexOf('src/service.ts')).toBeLessThan(sorted?.indexOf('src/controller.ts')!);
    });

    it('returns null when circular dependency cycle is introduced', () => {
      const files: SourceFileNode[] = [
        {
          filePath: 'src/a.ts',
          content: `import { b } from './b';`,
        },
        {
          filePath: 'src/b.ts',
          content: `import { c } from './c';`,
        },
        {
          filePath: 'src/c.ts',
          content: `import { a } from './a';`, // Cycle A -> B -> C -> A
        },
      ];

      const graph = service.buildGraph(files);
      const sorted = service.topologicalSort(graph);
      expect(sorted).toBeNull(); // Cycle detected
    });
  });
});
