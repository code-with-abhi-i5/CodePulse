/**
 * Architecture Service: Node.js Cluster Rolling Restart Manager
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-24]
 */

export interface ClusterWorker {
  id: number;
  pid: number;
  memoryBytes: number;
  isRestarting: boolean;
}

export class ClusterRollingRestartService {
  private workers: Map<number, ClusterWorker>;
  private memoryThresholdBytes: number;
  private isRollingRestartActive: boolean;

  constructor(memoryThresholdBytes: number = 1073741824) { // 1GB
    this.workers = new Map();
    this.memoryThresholdBytes = memoryThresholdBytes;
    this.isRollingRestartActive = false;
  }

  public registerWorker(id: number, pid: number, memoryBytes: number): void {
    this.workers.set(id, { id, pid, memoryBytes, isRestarting: false });
  }

  public updateWorkerMemory(id: number, memoryBytes: number): void {
    const w = this.workers.get(id);
    if (w) w.memoryBytes = memoryBytes;
  }

  public getBloatedWorkerIds(): number[] {
    const bloated: number[] = [];
    for (const w of this.workers.values()) {
      if (w.memoryBytes > this.memoryThresholdBytes && !w.isRestarting) {
        bloated.push(w.id);
      }
    }
    return bloated;
  }

  public restartNextWorker(newPid: number): { oldWorkerId: number; newPid: number } | null {
    if (this.isRollingRestartActive) return null; // Only one at a time
    const bloated = this.getBloatedWorkerIds();
    if (bloated.length === 0) return null;

    const workerId = bloated[0];
    const worker = this.workers.get(workerId)!;
    worker.isRestarting = true;
    this.isRollingRestartActive = true;

    // Simulate replacement
    this.workers.set(workerId, {
      id: workerId,
      pid: newPid,
      memoryBytes: 50000000, // Reset fresh memory
      isRestarting: false
    });
    this.isRollingRestartActive = false;

    return { oldWorkerId: workerId, newPid };
  }
}
