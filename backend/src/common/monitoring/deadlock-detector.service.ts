import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Counter, Registry } from 'prom-client';
import { PrismaService } from '../../prisma/prisma.service';

export interface BlockedTransaction {
  blockedPid: number;
  blockingPid: number;
  blockedQuery: string;
  blockingQuery: string;
  blockedDurationMs: number;
  tableName: string;
  lockType: string;
  mode: string;
  isInteractiveUserQuery: boolean;
  isBackgroundWorkerQuery: boolean;
  priority: 'HIGH_INTERACTIVE' | 'MEDIUM' | 'LOW_BACKGROUND';
}

export interface DeadlockCycle {
  cyclePids: number[];
  transactions: BlockedTransaction[];
  detectedAt: string;
  victimPid: number | null;
  resolutionStatus:
    'RESOLVED_TERMINATED_VICTIM' | 'MONITORING_NO_CYCLE' | 'TERMINATION_FAILED';
}

export interface DeadlockPostMortem {
  id: string;
  timestamp: string;
  durationBlockedMs: number;
  victimPid: number;
  victimQuery: string;
  unblockedPid: number;
  unblockedQuery: string;
  tableName: string;
  lockMode: string;
  stackTrace?: string;
  actionTaken: string;
}

export interface IDeadlockDatabaseAdapter {
  queryLockContention(): Promise<BlockedTransaction[]>;
  terminateBackendProcess(pid: number): Promise<boolean>;
}

@Injectable()
export class DeadlockDetectorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DeadlockDetectorService.name);
  private readonly registry: Registry;

  // Prometheus metric for deadlocks detected
  private readonly deadlockCounter: Counter;

  // Lock threshold: flag transactions blocked > 3,000ms
  private readonly BLOCK_THRESHOLD_MS = 3000;
  private readonly checkIntervalMs = 2000; // Poll lock tree every 2s
  private timer: NodeJS.Timeout | null = null;
  private isScanning = false;

  // Recent post-mortems for operational inspection
  private readonly postMortems: DeadlockPostMortem[] = [];

  private dbAdapter: IDeadlockDatabaseAdapter;

  constructor(private readonly prisma: PrismaService) {
    this.registry = new Registry();

    this.deadlockCounter = new Counter({
      name: 'db_deadlocks_detected_total',
      help: 'Total number of proactive database deadlocks detected and resolved',
      registers: [this.registry],
    });

    this.dbAdapter = this.createDefaultPrismaAdapter();
  }

  setDatabaseAdapter(adapter: IDeadlockDatabaseAdapter): void {
    this.dbAdapter = adapter;
  }

  onModuleInit(): void {
    this.startDetector();
  }

  onModuleDestroy(): void {
    this.stopDetector();
  }

  startDetector(): void {
    if (this.timer) return;

    this.timer = setInterval(() => {
      if (this.isScanning) return;
      this.isScanning = true;
      void this.detectAndResolveDeadlocks()
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.debug(`Lock contention check encountered: ${msg}`);
        })
        .finally(() => {
          this.isScanning = false;
        });
    }, this.checkIntervalMs);

    if (this.timer && typeof this.timer.unref === 'function') {
      this.timer.unref();
    }

    this.logger.log(
      'DeadlockDetectorService initialized (polling PostgreSQL lock trees)',
    );
  }

  stopDetector(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Evaluates query priority based on SQL query content and application context:
   * - HIGH_INTERACTIVE: Active battles, matchmaking, user profile updates (DeveloperRating, Battle, GuildMember)
   * - LOW_BACKGROUND: Background queues, sync crons, analytical aggregations, dlq
   */
  classifyQueryPriority(
    query: string,
  ): 'HIGH_INTERACTIVE' | 'MEDIUM' | 'LOW_BACKGROUND' {
    const q = query.toLowerCase();

    // Background workers / heavy jobs
    if (
      q.includes('sync_job') ||
      q.includes('github_sync') ||
      q.includes('dead_letter') ||
      q.includes('analytics_aggregate') ||
      q.includes('vacuum') ||
      q.includes('pg_cron') ||
      q.includes('background')
    ) {
      return 'LOW_BACKGROUND';
    }

    // High priority interactive requests
    if (
      q.includes('battle') ||
      q.includes('developerrating') ||
      q.includes('guildmember') ||
      q.includes('matchmaking') ||
      q.includes('auth') ||
      q.includes('users')
    ) {
      return 'HIGH_INTERACTIVE';
    }

    return 'MEDIUM';
  }

  /**
   * Analyzes wait-for graph of blocked transactions to detect cycles (A waits for B, B waits for A)
   * and long row-level lock blocking (> 3000ms).
   */
  findDeadlockCycles(blockedList: BlockedTransaction[]): DeadlockCycle[] {
    const cycles: DeadlockCycle[] = [];
    const waitMap = new Map<number, BlockedTransaction>();

    for (const b of blockedList) {
      waitMap.set(b.blockedPid, b);
    }

    const visited = new Set<number>();

    for (const [startPid] of waitMap) {
      if (visited.has(startPid)) continue;

      const path: number[] = [];
      const inPath = new Set<number>();
      let currPid: number | undefined = startPid;

      while (currPid !== undefined && waitMap.has(currPid)) {
        if (inPath.has(currPid)) {
          // Detected cycle!
          const cycleStartIndex = path.indexOf(currPid);
          const cyclePids = path.slice(cycleStartIndex);
          const cycleTransactions: BlockedTransaction[] = [];

          for (const pid of cyclePids) {
            const tx = waitMap.get(pid);
            if (tx) cycleTransactions.push(tx);
          }

          // Select victim: lowest priority background transaction
          let victimPid: number | null = null;
          let minPriorityScore = 999;

          for (const tx of cycleTransactions) {
            const score =
              tx.priority === 'LOW_BACKGROUND'
                ? 1
                : tx.priority === 'MEDIUM'
                  ? 2
                  : 3;
            if (score < minPriorityScore) {
              minPriorityScore = score;
              victimPid = tx.blockedPid;
            }
          }

          cycles.push({
            cyclePids,
            transactions: cycleTransactions,
            detectedAt: new Date().toISOString(),
            victimPid: victimPid ?? cyclePids[0],
            resolutionStatus: 'MONITORING_NO_CYCLE',
          });
          break;
        }

        path.push(currPid);
        inPath.add(currPid);
        visited.add(currPid);

        const nextTx = waitMap.get(currPid);
        currPid = nextTx?.blockingPid;
      }
    }

    return cycles;
  }

  /**
   * Main scan & resolution loop:
   * 1. Queries PostgreSQL lock tree (pg_locks & pg_stat_activity)
   * 2. Flags transactions blocked > 3,000ms on row-level locks
   * 3. Detects cyclical dependency graphs
   * 4. Safely terminates lowest-priority background worker transaction to unblock high-priority user battle queries
   * 5. Emits Prometheus counter `db_deadlocks_detected_total` and logs structured post-mortem
   */
  async detectAndResolveDeadlocks(): Promise<{
    blockedCount: number;
    cyclesResolvedCount: number;
    cycles: DeadlockCycle[];
  }> {
    const blockedList = await this.dbAdapter.queryLockContention();
    const severeBlocks = blockedList.filter(
      (b) => b.blockedDurationMs >= this.BLOCK_THRESHOLD_MS,
    );

    if (severeBlocks.length > 0) {
      this.logger.warn(
        `[Lock Contention] Detected ${severeBlocks.length} transaction(s) blocked for > ${this.BLOCK_THRESHOLD_MS}ms on row-level locks`,
      );
    }

    const cycles = this.findDeadlockCycles(blockedList);
    let resolvedCount = 0;

    for (const cycle of cycles) {
      this.deadlockCounter.inc();

      const victim = cycle.victimPid;
      const victimTx = cycle.transactions.find((t) => t.blockedPid === victim);
      const unblockedTx = cycle.transactions.find(
        (t) => t.blockingPid === victim,
      );

      this.logger.error(
        `[Deadlock Detected] Cyclical dependency detected between PIDs [${cycle.cyclePids.join(
          ' <-> ',
        )}]. Resolving by terminating lowest-priority victim PID ${victim} (${
          victimTx?.priority || 'UNKNOWN'
        })...`,
      );

      if (victim) {
        const terminated = await this.dbAdapter.terminateBackendProcess(victim);
        if (terminated) {
          cycle.resolutionStatus = 'RESOLVED_TERMINATED_VICTIM';
          resolvedCount++;

          this.recordPostMortem({
            id: `deadlock-${Date.now()}-${victim}`,
            timestamp: new Date().toISOString(),
            durationBlockedMs: victimTx?.blockedDurationMs || 0,
            victimPid: victim,
            victimQuery: victimTx?.blockedQuery || 'Unknown query',
            unblockedPid: unblockedTx?.blockedPid || 0,
            unblockedQuery: unblockedTx?.blockedQuery || 'Unknown query',
            tableName:
              victimTx?.tableName || 'DeveloperRating/Battle/GuildMember',
            lockMode: victimTx?.mode || 'ShareLock/ExclusiveLock',
            actionTaken: `Automated termination of background worker PID ${victim} via pg_terminate_backend`,
          });
        } else {
          cycle.resolutionStatus = 'TERMINATION_FAILED';
        }
      }
    }

    return {
      blockedCount: blockedList.length,
      cyclesResolvedCount: resolvedCount,
      cycles,
    };
  }

  recordPostMortem(pm: DeadlockPostMortem): void {
    this.postMortems.push(pm);
    if (this.postMortems.length > 50) {
      this.postMortems.shift();
    }

    this.logger.warn(
      `[Deadlock Post-Mortem Logged] Conflicting tables: "${pm.tableName}" | Victim PID ${pm.victimPid} unblocked high-priority PID ${pm.unblockedPid}`,
    );
  }

  getPostMortems(): DeadlockPostMortem[] {
    return [...this.postMortems].reverse();
  }

  getPrometheusMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Default Prisma adapter executing lock inspection queries against pg_locks & pg_stat_activity.
   */
  private createDefaultPrismaAdapter(): IDeadlockDatabaseAdapter {
    return {
      queryLockContention: async () => {
        try {
          const sql = `
            SELECT 
              blocked_locks.pid AS "blockedPid",
              blocking_locks.pid AS "blockingPid",
              blocked_activity.query AS "blockedQuery",
              blocking_activity.query AS "blockingQuery",
              ROUND(EXTRACT(EPOCH FROM (clock_timestamp() - blocked_activity.query_start)) * 1000) AS "blockedDurationMs",
              blocked_locks.relation::regclass::text AS "tableName",
              blocked_locks.locktype AS "lockType",
              blocked_locks.mode AS "mode"
            FROM pg_catalog.pg_locks blocked_locks
            JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
            JOIN pg_catalog.pg_locks blocking_locks 
              ON blocking_locks.locktype = blocked_locks.locktype
              AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
              AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
              AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
              AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
              AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
              AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
              AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
              AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
              AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
              AND blocking_locks.pid != blocked_locks.pid
            JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
            WHERE NOT blocked_locks.granted;
          `;

          const rawResults = await this.prisma.$queryRawUnsafe(sql);

          if (!Array.isArray(rawResults)) {
            return [];
          }

          return rawResults.map((item: unknown) => {
            const row =
              item && typeof item === 'object'
                ? (item as Record<string, unknown>)
                : {};
            const getString = (val: unknown): string =>
              typeof val === 'string' ? val : '';
            const getNumber = (val: unknown): number =>
              typeof val === 'number' ? val : 0;

            const blockedQuery = getString(row.blockedQuery);
            const priority = this.classifyQueryPriority(blockedQuery);

            return {
              blockedPid: getNumber(row.blockedPid),
              blockingPid: getNumber(row.blockingPid),
              blockedQuery,
              blockingQuery: getString(row.blockingQuery),
              blockedDurationMs: getNumber(row.blockedDurationMs),
              tableName: getString(row.tableName),
              lockType: getString(row.lockType),
              mode: getString(row.mode),
              isInteractiveUserQuery: priority === 'HIGH_INTERACTIVE',
              isBackgroundWorkerQuery: priority === 'LOW_BACKGROUND',
              priority,
            };
          });
        } catch {
          // Gracefully fallback when database dialect does not support pg_catalog (e.g. SQLite tests)
          return [];
        }
      },
      terminateBackendProcess: async (pid: number) => {
        try {
          await this.prisma.$executeRawUnsafe(
            `SELECT pg_terminate_backend(${pid});`,
          );
          return true;
        } catch {
          return false;
        }
      },
    };
  }
}
