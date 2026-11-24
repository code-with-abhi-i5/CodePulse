import { EbpfProfilerService } from './ebpf-profiler.service';
import { FlamegraphGeneratorService } from './flamegraph-generator.service';

describe('EbpfProfilerService & FlamegraphGeneratorService', () => {
  let profiler: EbpfProfilerService;
  let flameGen: FlamegraphGeneratorService;

  beforeEach(() => {
    profiler = new EbpfProfilerService();
    flameGen = new FlamegraphGeneratorService();
  });

  describe('EbpfProfilerService', () => {
    it('should record raw stack frames and aggregate identical stack counts', () => {
      profiler.startSession(99);
      profiler.recordSample(['node', 'express::handle', 'authMiddleware'], 10);
      profiler.recordSample(['node', 'express::handle', 'authMiddleware'], 5);
      profiler.recordSample(['node', 'express::handle', 'dbQuery'], 25);

      const report = profiler.getProfileReport();
      expect(report.totalSamples).toBe(40);
      expect(report.uniqueStacks).toBe(2);

      expect(report.topHotspots[0].functionName).toBe('dbQuery');
      expect(report.topHotspots[0].samples).toBe(25);
      expect(report.topHotspots[0].percentage).toBe(62.5);

      expect(report.topHotspots[1].functionName).toBe('authMiddleware');
      expect(report.topHotspots[1].samples).toBe(15);
      expect(report.topHotspots[1].percentage).toBe(37.5);
    });

    it('should parse external folded stack strings', () => {
      const folded = [
        'main;worker_loop;json_parse 50',
        'main;worker_loop;crypto_verify 150',
      ];
      profiler.loadFoldedStacks(folded);

      const report = profiler.getProfileReport();
      expect(report.totalSamples).toBe(200);
      expect(report.topHotspots[0].functionName).toBe('crypto_verify');
      expect(report.topHotspots[0].percentage).toBe(75.0);
    });
  });

  describe('FlamegraphGeneratorService', () => {
    it('should build hierarchical flame tree from folded stacks', () => {
      const folded = [
        'entry;reqHandler;execQuery 60',
        'entry;reqHandler;renderTemplate 40',
      ];

      const tree = flameGen.buildFlameTree(folded);
      expect(tree.name).toBe('root');
      expect(tree.value).toBe(100);

      expect(tree.children.length).toBe(1);
      const entryNode = tree.children[0];
      expect(entryNode.name).toBe('entry');
      expect(entryNode.value).toBe(100);

      const reqHandler = entryNode.children[0];
      expect(reqHandler.children.length).toBe(2);

      const execQuery = reqHandler.children.find((c) => c.name === 'execQuery');
      expect(execQuery?.value).toBe(60);
    });

    it('should render valid SVG flame graph containing function tags and sample totals', () => {
      const folded = [
        'node;libuv;epoll_wait 80',
        'node;v8;Compile 20',
      ];

      const tree = flameGen.buildFlameTree(folded);
      const svg = flameGen.renderSvg(tree, 1000, 20);

      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('Total Samples: 100');
      expect(svg).toContain('epoll_wait');
      expect(svg).toContain('Compile');
    });
  });
});
