import { Injectable, Logger } from '@nestjs/common';
import { ClientTrackerService, TrackedSocket } from './client-tracker.service';

export interface LeakedSocketDiagnostic {
  socketId: string;
  namespace: string;
  leakType: 'DANGLING_DISCONNECTED_INSTANCE' | 'EXCESSIVE_EVENT_LISTENERS' | 'ORPHANED_ROOM_MEMBERSHIP';
  details: string;
  retainedDurationSec: number;
}

export interface LeakAuditReport {
  timestamp: Date;
  totalTrackedSockets: number;
  activeSockets: number;
  disconnectedRetainedSockets: number;
  detectedLeaks: LeakedSocketDiagnostic[];
  reclaimedCount: number;
  heapUsedMb: number;
}

@Injectable()
export class SocketLeakDetectorService {
  private readonly logger = new Logger(SocketLeakDetectorService.name);

  // Maximum tolerated delay before disconnected socket is considered leaked (e.g. 5 seconds for tests/fast audit)
  public static readonly DISCONNECT_GRACE_PERIOD_SEC = 5;
  // Maximum listeners per event before considered a closure leak
  public static readonly MAX_LISTENERS_PER_EVENT = 10;

  constructor(private readonly clientTracker: ClientTrackerService) {}

  /**
   * Audits the connection pool for dangling references, uncleaned listeners, and memory leaks.
   */
  public runAudit(autoReclaim = true): LeakAuditReport {
    const now = Date.now();
    const sockets = this.clientTracker.getTrackedSockets();
    const detectedLeaks: LeakedSocketDiagnostic[] = [];
    let reclaimedCount = 0;
    let disconnectedCount = 0;
    let activeCount = 0;

    for (const socket of sockets) {
      if (!socket.isAlive && socket.disconnectedAt) {
        disconnectedCount++;
        const elapsedSec = (now - socket.disconnectedAt.getTime()) / 1000;

        if (elapsedSec > SocketLeakDetectorService.DISCONNECT_GRACE_PERIOD_SEC) {
          detectedLeaks.push({
            socketId: socket.socketId,
            namespace: socket.namespace,
            leakType: 'DANGLING_DISCONNECTED_INSTANCE',
            details: `Socket disconnected ${Math.round(elapsedSec)}s ago but reference still retained in memory maps with ${socket.rooms.size} rooms.`,
            retainedDurationSec: Math.round(elapsedSec),
          });

          if (autoReclaim) {
            this.clientTracker.purgeSocket(socket.socketId);
            reclaimedCount++;
          }
        }
      } else {
        activeCount++;
        // Check for closure listener leaks
        for (const [event, count] of socket.listenerCounts.entries()) {
          if (count > SocketLeakDetectorService.MAX_LISTENERS_PER_EVENT) {
            detectedLeaks.push({
              socketId: socket.socketId,
              namespace: socket.namespace,
              leakType: 'EXCESSIVE_EVENT_LISTENERS',
              details: `Event '${event}' has ${count} listeners registered on socket (max: ${SocketLeakDetectorService.MAX_LISTENERS_PER_EVENT}). Possible closure memory leak.`,
              retainedDurationSec: 0,
            });
          }
        }
      }
    }

    const mem = process.memoryUsage();
    const report: LeakAuditReport = {
      timestamp: new Date(),
      totalTrackedSockets: sockets.length,
      activeSockets: activeCount,
      disconnectedRetainedSockets: disconnectedCount,
      detectedLeaks,
      reclaimedCount,
      heapUsedMb: Number((mem.heapUsed / 1024 / 1024).toFixed(2)),
    };

    if (detectedLeaks.length > 0) {
      this.logger.warn(`Socket Leak Audit found ${detectedLeaks.length} leak anomalies. Reclaimed: ${reclaimedCount}`);
    }

    return report;
  }
}
