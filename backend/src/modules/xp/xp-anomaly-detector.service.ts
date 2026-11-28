import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FraudAlertStatus } from '@prisma/client';

@Injectable()
export class XpAnomalyDetectorService {
  private readonly logger = new Logger(XpAnomalyDetectorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Flags and registers a statistical XP velocity anomaly into the fraud alert ledger.
   */
  async recordFraudAlert(params: {
    userId: string;
    amount: number;
    source: string;
    reason: string;
    anomalyScore: number;
    transactionId?: string;
  }) {
    this.logger.warn(
      `Flagging XP anomaly for user ${params.userId}: +${params.amount} XP from ${params.source} (Anomaly Score: ${params.anomalyScore})`,
    );

    return this.prisma.xpFraudAlert.create({
      data: {
        userId: params.userId,
        flaggedAmount: params.amount,
        source: params.source,
        reason: params.reason,
        anomalyScore: params.anomalyScore,
        status: FraudAlertStatus.FLAGGED,
        transactionId: params.transactionId,
      },
    });
  }

  /**
   * Retrieves paginated fraud alerts for administrator inspection.
   */
  async getFraudAlerts(query: {
    status?: FraudAlertStatus;
    page?: number;
    limit?: number;
  } = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where = query.status ? { status: query.status } : {};

    const [alerts, total] = await Promise.all([
      this.prisma.xpFraudAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.xpFraudAlert.count({ where }),
    ]);

    return {
      alerts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
