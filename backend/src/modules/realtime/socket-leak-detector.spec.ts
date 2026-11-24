import { ClientTrackerService } from './client-tracker.service';
import { SocketLeakDetectorService } from './socket-leak-detector.service';

describe('SocketLeakDetectorService & ClientTrackerService', () => {
  let tracker: ClientTrackerService;
  let leakDetector: SocketLeakDetectorService;

  beforeEach(() => {
    tracker = new ClientTrackerService();
    leakDetector = new SocketLeakDetectorService(tracker);
  });

  describe('ClientTrackerService', () => {
    it('should register new sockets and track event listener registrations', () => {
      const socket = tracker.registerSocket('sock-100', '/battles');
      expect(socket.socketId).toBe('sock-100');
      expect(socket.namespace).toBe('/battles');
      expect(socket.isAlive).toBe(true);

      tracker.trackEventListener('sock-100', 'playerMove');
      tracker.trackEventListener('sock-100', 'playerMove');
      expect(tracker.getSocket('sock-100')?.listenerCounts.get('playerMove')).toBe(2);
    });

    it('should mark sockets as disconnected without immediate deletion', () => {
      tracker.registerSocket('sock-200');
      tracker.markDisconnected('sock-200');

      const sock = tracker.getSocket('sock-200');
      expect(sock?.isAlive).toBe(false);
      expect(sock?.disconnectedAt).toBeDefined();
    });
  });

  describe('SocketLeakDetectorService audit and reclamation', () => {
    it('should detect and auto-reclaim dangling disconnected socket references', () => {
      tracker.registerSocket('sock-leaked');
      tracker.markDisconnected('sock-leaked');

      // Artificially age the disconnect time beyond the 5s grace period
      const sock = tracker.getSocket('sock-leaked')!;
      sock.disconnectedAt = new Date(Date.now() - 10000); // 10s ago

      const report = leakDetector.runAudit(true);
      expect(report.detectedLeaks.length).toBe(1);
      expect(report.detectedLeaks[0].leakType).toBe('DANGLING_DISCONNECTED_INSTANCE');
      expect(report.reclaimedCount).toBe(1);

      // Verify socket is purged from pool
      expect(tracker.getSocket('sock-leaked')).toBeUndefined();
    });

    it('should detect excessive event listener registrations as potential memory leaks', () => {
      tracker.registerSocket('sock-busy');
      for (let i = 0; i < 15; i++) {
        tracker.trackEventListener('sock-busy', 'dataStream');
      }

      const report = leakDetector.runAudit(false);
      expect(report.detectedLeaks.length).toBe(1);
      expect(report.detectedLeaks[0].leakType).toBe('EXCESSIVE_EVENT_LISTENERS');
      expect(report.detectedLeaks[0].details).toContain('dataStream');
    });
  });
});
