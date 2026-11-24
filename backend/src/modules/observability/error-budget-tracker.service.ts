import { Injectable, Logger } from '@nestjs/common';

export interface SloDefinition {
  sloId: string;
  name: string;
  targetPercent: number; // e.g. 99.9%
  rollingWindowDays: number; // e.g. 30 days
}

export interface SliEvent {
  timestampMs: number;
  isGood: boolean; // true = success, false = failure/error
}

export interface ErrorBudgetStatus {
  sloId: string;
  targetPercent: number;
  totalEvents: number;
  goodEvents: number;
  badEvents: number;
  actualSliPercent: number;
  allowedErrorBudgetPercent: number;
  consumedErrorBudgetPercent: number;
  remainingErrorBudgetPercent: number;
  isBudgetExhausted: boolean;
}

@Injectable()
export class ErrorBudgetTrackerService {
  private readonly logger = new Logger(ErrorBudgetTrackerService.name);

  private readonly sloDefinitions = new Map<string, SloDefinition>();
  private readonly eventHistory = new Map<string, SliEvent[]>();

  constructor() {
    // Default 99.9% 30-day availability SLO
    this.registerSlo({
      sloId: 'availability',
      name: 'API Availability SLO',
      targetPercent: 99.9,
      rollingWindowDays: 30,
    });
  }

  public registerSlo(slo: SloDefinition): void {
    this.sloDefinitions.set(slo.sloId, slo);
    if (!this.eventHistory.has(slo.sloId)) {
      this.eventHistory.set(slo.sloId, []);
    }
  }

  /**
   * Records an SLI measurement event (success or failure).
   */
  public recordEvent(sloId: string, isGood: boolean, timestampMs = Date.now()): void {
    const list = this.eventHistory.get(sloId);
    if (list) {
      list.push({ timestampMs, isGood });
    }
  }

  /**
   * Calculates the error rate over a specific historical duration window in milliseconds.
   */
  public calculateWindowErrorRate(sloId: string, windowDurationMs: number, nowMs = Date.now()): {
    total: number;
    bad: number;
    errorRate: number;
  } {
    const list = this.eventHistory.get(sloId) || [];
    const cutoff = nowMs - windowDurationMs;

    let total = 0;
    let bad = 0;
    for (let i = list.length - 1; i >= 0; i--) {
      const ev = list[i];
      if (ev.timestampMs < cutoff) break;
      total++;
      if (!ev.isGood) bad++;
    }

    const errorRate = total > 0 ? bad / total : 0;
    return { total, bad, errorRate };
  }

  /**
   * Calculates current overall error budget consumption for an SLO.
   */
  public getBudgetStatus(sloId: string, nowMs = Date.now()): ErrorBudgetStatus {
    const slo = this.sloDefinitions.get(sloId);
    if (!slo) {
      throw new Error(`SLO ${sloId} not registered`);
    }

    const windowDurationMs = slo.rollingWindowDays * 24 * 60 * 60 * 1000;
    const { total, bad } = this.calculateWindowErrorRate(sloId, windowDurationMs, nowMs);
    const good = total - bad;

    const actualSli = total > 0 ? (good / total) * 100 : 100;
    const allowedErrorBudgetPercent = 100 - slo.targetPercent; // 0.1% for 99.9% SLO
    const actualErrorPercent = total > 0 ? (bad / total) * 100 : 0;
    const consumedErrorBudgetPercent = allowedErrorBudgetPercent > 0
      ? (actualErrorPercent / allowedErrorBudgetPercent) * 100
      : 0;

    const remainingErrorBudgetPercent = Math.max(0, 100 - consumedErrorBudgetPercent);

    return {
      sloId,
      targetPercent: slo.targetPercent,
      totalEvents: total,
      goodEvents: good,
      badEvents: bad,
      actualSliPercent: Number(actualSli.toFixed(3)),
      allowedErrorBudgetPercent: Number(allowedErrorBudgetPercent.toFixed(3)),
      consumedErrorBudgetPercent: Number(consumedErrorBudgetPercent.toFixed(2)),
      remainingErrorBudgetPercent: Number(remainingErrorBudgetPercent.toFixed(2)),
      isBudgetExhausted: remainingErrorBudgetPercent <= 0,
    };
  }
}
