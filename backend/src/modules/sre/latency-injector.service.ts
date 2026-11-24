import { Injectable, Logger } from '@nestjs/common';

export interface NetemRule {
  targetService?: string;
  delayMs: number;
  jitterMs: number;
  packetLossPercent: number; // 0 to 100
  enabled: boolean;
}

@Injectable()
export class LatencyInjectorService {
  private readonly logger = new Logger(LatencyInjectorService.name);

  private currentRule: NetemRule = {
    delayMs: 0,
    jitterMs: 0,
    packetLossPercent: 0,
    enabled: false,
  };

  /**
   * Configures software-simulated Linux tc netem traffic control rules.
   */
  public configureRule(rule: Partial<NetemRule>): NetemRule {
    this.currentRule = {
      targetService: rule.targetService,
      delayMs: rule.delayMs ?? 0,
      jitterMs: rule.jitterMs ?? 0,
      packetLossPercent: rule.packetLossPercent ?? 0,
      enabled: rule.enabled ?? true,
    };

    this.logger.log(
      `Configured tc netem chaos rule: delay=${this.currentRule.delayMs}ms (+/-${this.currentRule.jitterMs}ms), loss=${this.currentRule.packetLossPercent}% (enabled=${this.currentRule.enabled})`
    );

    return this.currentRule;
  }

  /**
   * Evaluates packet loss probability simulating network dropped frames.
   */
  public shouldDropPacket(): boolean {
    const loss = this.currentRule.packetLossPercent ?? 0;
    if (!this.currentRule.enabled || loss <= 0) {
      return false;
    }
    const roll = Math.random() * 100;
    return roll < loss;
  }

  /**
   * Injects latency matching normal distribution delay +/- jitter.
   */
  public async injectLatency(): Promise<number> {
    if (!this.currentRule.enabled || this.currentRule.delayMs <= 0) {
      return 0;
    }

    const jitter = this.currentRule.jitterMs ?? 0;
    const jitterOffset = jitter > 0
      ? (Math.random() * 2 - 1) * jitter
      : 0;

    const actualDelay = Math.max(0, Math.floor(this.currentRule.delayMs + jitterOffset));

    if (actualDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, actualDelay));
    }

    return actualDelay;
  }

  public getRule(): NetemRule {
    return { ...this.currentRule };
  }

  public resetRules(): void {
    this.currentRule = {
      delayMs: 0,
      jitterMs: 0,
      packetLossPercent: 0,
      enabled: false,
    };
  }
}
