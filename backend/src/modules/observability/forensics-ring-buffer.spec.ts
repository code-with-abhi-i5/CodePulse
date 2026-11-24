import { ForensicsRingBufferService } from './forensics-ring-buffer.service';
import { PostMortemDumperService } from './post-mortem-dumper.service';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('ForensicsRingBufferService & PostMortemDumperService', () => {
  let ringBuffer: ForensicsRingBufferService;
  let dumper: PostMortemDumperService;
  let tempDir: string;

  beforeEach(() => {
    ringBuffer = new ForensicsRingBufferService();
    dumper = new PostMortemDumperService(ringBuffer);
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forensics-test-'));
  });

  afterEach(() => {
    ringBuffer.onModuleDestroy();
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  describe('ForensicsRingBufferService high-resolution recording', () => {
    it('should record snapshots and maintain chronological ordering', () => {
      ringBuffer.captureSnapshot(1000);
      ringBuffer.captureSnapshot(1100);
      ringBuffer.captureSnapshot(1200);

      const flightData = ringBuffer.getFlightRecorderData();
      expect(flightData.length).toBe(3);
      expect(flightData[0].timestampMs).toBe(1000);
      expect(flightData[1].timestampMs).toBe(1100);
      expect(flightData[2].timestampMs).toBe(1200);
    });

    it('should preserve circular buffer boundary without memory leaks', () => {
      // Capture 3005 snapshots (buffer capacity is 3000)
      for (let i = 0; i < 3005; i++) {
        ringBuffer.captureSnapshot(i);
      }

      const flightData = ringBuffer.getFlightRecorderData();
      expect(flightData.length).toBe(3000);
      // Oldest entry should be index 5
      expect(flightData[0].timestampMs).toBe(5);
      expect(flightData[2999].timestampMs).toBe(3004);
    });
  });

  describe('PostMortemDumperService incident dump', () => {
    it('should synchronously serialize flight telemetry to json on disk upon incident', () => {
      ringBuffer.captureSnapshot(Date.now() - 200);
      ringBuffer.captureSnapshot(Date.now() - 100);
      ringBuffer.captureSnapshot(Date.now());

      const dumpFile = dumper.dumpForensicsSync('Fatal SIGSEGV simulation', tempDir);
      expect(fs.existsSync(dumpFile)).toBe(true);

      const parsed = JSON.parse(fs.readFileSync(dumpFile, 'utf8'));
      expect(parsed.reason).toBe('Fatal SIGSEGV simulation');
      expect(parsed.metricsSummary.totalSnapshots).toBe(3);
      expect(parsed.telemetry.length).toBe(3);
      expect(parsed.processInfo.pid).toBe(process.pid);
    });
  });
});
