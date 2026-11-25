/**
 * Architecture Service: Database Connection Pool Warm-Up Worker
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-13]
 */

export class DatabaseConnectionPoolWarmUpWorkerService {
  public async warmUpPool(
    minConnections: number,
    pingFn: (connIndex: number) => Promise<boolean>
  ): Promise<{ warmedCount: number; failedCount: number; durationMs: number }> {
    const start = Date.now();
    let warmedCount = 0;
    let failedCount = 0;

    const tasks: Array<Promise<void>> = [];
    for (let i = 0; i < minConnections; i++) {
      tasks.push(
        pingFn(i)
          .then((success) => {
            if (success) warmedCount++;
            else failedCount++;
          })
          .catch(() => {
            failedCount++;
          })
      );
    }

    await Promise.all(tasks);
    const durationMs = Date.now() - start;

    return { warmedCount, failedCount, durationMs };
  }
}
