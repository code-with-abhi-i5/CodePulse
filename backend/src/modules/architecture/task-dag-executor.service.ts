export interface DagTask<T = any> {
  id: string;
  dependencies: string[];
  execute: () => Promise<T> | T;
}

export type TaskStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

export interface TaskExecutionReport {
  taskId: string;
  status: TaskStatus;
  result?: any;
  error?: string;
  durationMs: number;
}

export class TaskDagWorkflowExecutorService {
  public validateAcyclic(tasks: DagTask[]): { valid: boolean; cycle?: string[] } {
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();

    for (const t of tasks) {
      inDegree.set(t.id, 0);
      adj.set(t.id, []);
    }

    for (const t of tasks) {
      for (const dep of t.dependencies) {
        if (!adj.has(dep)) {
          throw new Error(`Unknown dependency task '${dep}' for task '${t.id}'`);
        }
        adj.get(dep)!.push(t.id);
        inDegree.set(t.id, (inDegree.get(t.id) || 0) + 1);
      }
    }

    // Kahn's algorithm
    const queue: string[] = [];
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) queue.push(id);
    }

    let visitedCount = 0;
    while (queue.length > 0) {
      const curr = queue.shift()!;
      visitedCount++;
      for (const neighbor of adj.get(curr) || []) {
        inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    if (visitedCount !== tasks.length) {
      return { valid: false, cycle: tasks.filter(t => (inDegree.get(t.id) || 0) > 0).map(t => t.id) };
    }

    return { valid: true };
  }

  public async executeDag(tasks: DagTask[]): Promise<Map<string, TaskExecutionReport>> {
    const validation = this.validateAcyclic(tasks);
    if (!validation.valid) {
      throw new Error(`Cycle detected in DAG among tasks: ${validation.cycle?.join(', ')}`);
    }

    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const reports = new Map<string, TaskExecutionReport>();
    const completed = new Set<string>();
    const failed = new Set<string>();

    for (const t of tasks) {
      reports.set(t.id, { taskId: t.id, status: 'PENDING', durationMs: 0 });
    }

    while (completed.size + failed.size < tasks.length) {
      // Find tasks ready to run
      const readyTasks = tasks.filter(t => {
        if (reports.get(t.id)!.status !== 'PENDING') return false;
        // Check if any dependency failed
        if (t.dependencies.some(dep => failed.has(dep))) {
          reports.set(t.id, { taskId: t.id, status: 'SKIPPED', durationMs: 0 });
          failed.add(t.id);
          return false;
        }
        return t.dependencies.every(dep => completed.has(dep));
      });

      if (readyTasks.length === 0) {
        break; // All remaining are skipped or blocked
      }

      // Execute ready tasks concurrently
      await Promise.all(
        readyTasks.map(async task => {
          const report = reports.get(task.id)!;
          report.status = 'RUNNING';
          const start = Date.now();
          try {
            const res = await task.execute();
            report.status = 'COMPLETED';
            report.result = res;
            completed.add(task.id);
          } catch (err: any) {
            report.status = 'FAILED';
            report.error = err?.message || String(err);
            failed.add(task.id);
          } finally {
            report.durationMs = Date.now() - start;
          }
        })
      );
    }

    return reports;
  }
}
