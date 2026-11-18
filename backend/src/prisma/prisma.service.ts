import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Optional,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ReplicaBalancerService } from './replica-balancer.service';

const DEFAULT_SLOW_QUERY_THRESHOLD_MS = 200;

function slowQueryThresholdMs(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_SLOW_QUERY_THRESHOLD_MS;
}

@Injectable()
export class PrismaService
  extends PrismaClient<{ log: [{ emit: 'event'; level: 'query' }] }>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(
    @Optional()
    public readonly replicaBalancer?: ReplicaBalancerService,
  ) {
    super({ log: [{ emit: 'event', level: 'query' }] });

    const thresholdMs = slowQueryThresholdMs(
      process.env.SLOW_QUERY_THRESHOLD_MS,
    );
    this.$on('query', (event) => {
      if (event.duration <= thresholdMs) return;

      // Prisma parameters can contain credentials and personal data. Keep the
      // SQL and count for diagnosis, but never write parameter values to logs.
      let parameterCount: number | null = null;
      try {
        const parameters: unknown = JSON.parse(event.params);
        if (Array.isArray(parameters)) parameterCount = parameters.length;
      } catch {
        // Some providers serialize parameters differently; timing still logs.
      }

      this.logger.warn(
        JSON.stringify({
          event: 'slow_prisma_query',
          durationMs: event.duration,
          thresholdMs,
          query: event.query,
          params: '[REDACTED]',
          parameterCount,
        }),
      );
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Executes a read query routed through the intelligent read-replica load balancer
   * with query cost weighting and automatic replication lag failover.
   */
  async executeRead<T>(
    operationName: string,
    args: Record<string, unknown> | undefined,
    action: (client: PrismaClient) => Promise<T>,
  ): Promise<T> {
    if (this.replicaBalancer) {
      return this.replicaBalancer.executeRead(operationName, args, action);
    }
    return action(this);
  }
}
