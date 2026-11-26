import { StackFrame, FlamegraphNode } from '../../types/sre';

export class CpuFlamegraphGenerator {
  generateFlamegraphTree(frames: StackFrame[]): FlamegraphNode {
    const root: FlamegraphNode = {
      name: 'root',
      value: 0,
      children: []
    };

    let totalHits = 0;
    for (const frame of frames) {
      totalHits += frame.hitCount;
      const child: FlamegraphNode = {
        name: `${frame.functionName} (${frame.fileName}:${frame.lineNumber})`,
        value: frame.hitCount,
        children: []
      };
      root.children.push(child);
    }

    root.value = totalHits;
    return root;
  }

  identifyHotspotFunctions(frames: StackFrame[], thresholdPercent: number = 20): StackFrame[] {
    const totalHits = frames.reduce((acc, f) => acc + f.hitCount, 0);
    if (totalHits === 0) return [];

    return frames.filter(f => (f.hitCount / totalHits) * 100 >= thresholdPercent);
  }
}
