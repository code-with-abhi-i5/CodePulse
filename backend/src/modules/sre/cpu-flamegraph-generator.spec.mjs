import test from 'node:test';
import assert from 'node:assert/strict';

class CpuFlamegraphGenerator {
  generateFlamegraphTree(frames) {
    const root = {
      name: 'root',
      value: 0,
      children: []
    };

    let totalHits = 0;
    for (const frame of frames) {
      totalHits += frame.hitCount;
      const child = {
        name: `${frame.functionName} (${frame.fileName}:${frame.lineNumber})`,
        value: frame.hitCount,
        children: []
      };
      root.children.push(child);
    }

    root.value = totalHits;
    return root;
  }

  identifyHotspotFunctions(frames, thresholdPercent = 20) {
    const totalHits = frames.reduce((acc, f) => acc + f.hitCount, 0);
    if (totalHits === 0) return [];

    return frames.filter(f => (f.hitCount / totalHits) * 100 >= thresholdPercent);
  }
}

test('CpuFlamegraphGenerator - aggregates call stacks and flags CPU hotspot bottlenecks', () => {
  const gen = new CpuFlamegraphGenerator();
  const frames = [
    { functionName: 'compileAST', fileName: 'compiler.ts', lineNumber: 42, hitCount: 800 },
    { functionName: 'evalRegex', fileName: 'lexer.ts', lineNumber: 18, hitCount: 150 },
    { functionName: 'logOutput', fileName: 'logger.ts', lineNumber: 10, hitCount: 50 }
  ];

  const tree = gen.generateFlamegraphTree(frames);
  assert.strictEqual(tree.value, 1000);
  assert.strictEqual(tree.children.length, 3);

  const hotspots = gen.identifyHotspotFunctions(frames, 20);
  assert.strictEqual(hotspots.length, 1);
  assert.strictEqual(hotspots[0].functionName, 'compileAST');
});
