import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ForensicsRingBufferService, TelemetrySnapshot } from './forensics-ring-buffer.service';

export interface PostMortemDump {
  dumpId: string;
  triggeredAt: Date;
  reason: string;
  processInfo: {
    pid: number;
    uptimeSec: number;
    nodeVersion: string;
    platform: string;
  };
  metricsSummary: {
    totalSnapshots: number;
    durationCoveredSec: number;
    peakHeapUsedMb: number;
    peakRssMb: number;
  };
  telemetry: TelemetrySnapshot[];
}

@Injectable()
export class PostMortemDumperService implements OnModuleInit {
  private readonly logger = new Logger(PostMortemDumperService.name);
  private dumpDirectory: string;

  constructor(private readonly ringBuffer: ForensicsRingBufferService) {
    this.dumpDirectory = path.join(process.cwd(), 'dumps');
  }

  onModuleInit() {
    this.registerProcessHooks();
  }

  public setDumpDirectory(dir: string): void {
    this.dumpDirectory = dir;
  }

  private registerProcessHooks(): void {
    // Register crash hooks
    process.once('uncaughtException', (err) => {
      this.dumpForensicsSync(`uncaughtException: ${err?.message}\n${err?.stack}`);
    });

    process.once('unhandledRejection', (reason: any) => {
      this.dumpForensicsSync(`unhandledRejection: ${reason?.message || reason}`);
    });
  }

  /**
   * Synchronously writes the 300-second flight recorder buffer to disk during crash conditions.
   */
  public dumpForensicsSync(reason: string, customOutputDir?: string): string {
    const targetDir = customOutputDir || this.dumpDirectory;
    if (!fs.existsSync(targetDir)) {
      try {
        fs.mkdirSync(targetDir, { recursive: true });
      } catch {
        // fallback
      }
    }

    const data = this.ringBuffer.getFlightRecorderData();
    let peakHeap = 0;
    let peakRss = 0;

    for (const snap of data) {
      if (snap.heapUsedBytes > peakHeap) peakHeap = snap.heapUsedBytes;
      if (snap.rssBytes > peakRss) peakRss = snap.rssBytes;
    }

    const timestamp = Date.now();
    const dumpId = `crash-dump-${timestamp}`;
    const filename = path.join(targetDir, `${dumpId}.json`);

    const dump: PostMortemDump = {
      dumpId,
      triggeredAt: new Date(),
      reason,
      processInfo: {
        pid: process.pid,
        uptimeSec: Math.round(process.uptime()),
        nodeVersion: process.version,
        platform: process.platform,
      },
      metricsSummary: {
        totalSnapshots: data.length,
        durationCoveredSec: data.length > 0 ? (data.length * 100) / 1000 : 0,
        peakHeapUsedMb: Number((peakHeap / 1024 / 1024).toFixed(2)),
        peakRssMb: Number((peakRss / 1024 / 1024).toFixed(2)),
      },
      telemetry: data,
    };

    try {
      fs.writeFileSync(filename, JSON.stringify(dump, null, 2), 'utf8');
      this.logger.error(`Post-Mortem crash telemetry dumped successfully to ${filename}`);
    } catch (err: any) {
      this.logger.error(`Failed to write post-mortem dump: ${err?.message}`);
    }

    return filename;
  }
}
