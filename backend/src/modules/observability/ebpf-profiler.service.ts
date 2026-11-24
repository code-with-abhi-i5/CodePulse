import { Injectable, Logger } from '@nestjs/common';

export interface StackSample {
  stack: string[]; // ['[k] vfs_read', 'node::fs::Read', 'fs.readFileSync']
  count: number;
  cpuTimeNs?: number;
}

export interface ProfileReport {
  totalSamples: number;
  uniqueStacks: number;
  topHotspots: Array<{ functionName: string; samples: number; percentage: number }>;
  foldedStacks: string[];
}

@Injectable()
export class EbpfProfilerService {
  private readonly logger = new Logger(EbpfProfilerService.name);
  private isSampling = false;
  private readonly sampleBuffer = new Map<string, number>();

  /**
   * Starts continuous low-overhead eBPF CPU sampling session.
   */
  public startSession(frequencyHz = 99): void {
    this.isSampling = true;
    this.sampleBuffer.clear();
    this.logger.log(`eBPF continuous profiler started at sampling frequency ${frequencyHz}Hz`);
  }

  /**
   * Records a raw stack trace sample collected by eBPF probe or Node.js CPU profiler.
   */
  public recordSample(frames: string[], count = 1): void {
    if (!this.isSampling && this.sampleBuffer.size === 0) {
      // Auto-start if not explicitly started
      this.isSampling = true;
    }
    const stackKey = frames.join(';');
    const current = this.sampleBuffer.get(stackKey) || 0;
    this.sampleBuffer.set(stackKey, current + count);
  }

  /**
   * Stops continuous sampling.
   */
  public stopSession(): void {
    this.isSampling = false;
    this.logger.log('eBPF continuous profiler stopped');
  }

  /**
   * Generates profile report summarizing CPU hotspots and folded stack traces.
   */
  public getProfileReport(): ProfileReport {
    let totalSamples = 0;
    const functionCount = new Map<string, number>();
    const foldedStacks: string[] = [];

    for (const [stackStr, count] of this.sampleBuffer.entries()) {
      totalSamples += count;
      foldedStacks.push(`${stackStr} ${count}`);

      const frames = stackStr.split(';');
      // Top of stack is the immediate executing function
      const leafFunction = frames[frames.length - 1];
      functionCount.set(leafFunction, (functionCount.get(leafFunction) || 0) + count);
    }

    const topHotspots: Array<{ functionName: string; samples: number; percentage: number }> = [];
    for (const [func, count] of functionCount.entries()) {
      const percentage = totalSamples > 0 ? Number(((count / totalSamples) * 100).toFixed(2)) : 0;
      topHotspots.push({ functionName: func, samples: count, percentage });
    }

    topHotspots.sort((a, b) => b.samples - a.samples);

    return {
      totalSamples,
      uniqueStacks: this.sampleBuffer.size,
      topHotspots: topHotspots.slice(0, 15),
      foldedStacks,
    };
  }

  /**
   * Loads sample folded stacks directly (e.g. from Parca or perf script).
   */
  public loadFoldedStacks(folded: string[]): void {
    for (const line of folded) {
      const lastSpace = line.lastIndexOf(' ');
      if (lastSpace === -1) continue;
      const stack = line.substring(0, lastSpace);
      const count = parseInt(line.substring(lastSpace + 1), 10);
      if (!isNaN(count)) {
        this.sampleBuffer.set(stack, (this.sampleBuffer.get(stack) || 0) + count);
      }
    }
  }
}
