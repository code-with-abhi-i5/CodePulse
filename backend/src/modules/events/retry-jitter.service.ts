import { Injectable, Logger } from '@nestjs/common';

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold?: number; // e.g. 5 consecutive failures
  cooldownPeriodMs?: number; // e.g. 5000ms
  halfOpenMaxTrials?: number; // e.g. 3 successful trials to close
}

export interface CircuitBreakerTelemetry {
  state: CircuitBreakerState;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  totalTripsToOpen: number;
  lastStateChangeTimestamp: number;
  lastFailureTimestamp: number | null;
}

@Injectable()
export class RetryJitterService {
  private readonly logger = new Logger(RetryJitterService.name);

  private state: CircuitBreakerState = 'CLOSED';
  private consecutiveFailures = 0;
  private consecutiveSuccesses = 0;
  private totalTrips = 0;
  private lastStateChange = Date.now();
  private lastFailureTime: number | null = null;

  private readonly failureThreshold: number;
  private readonly cooldownPeriodMs: number;
  private readonly halfOpenMaxTrials: number;

  constructor(options?: CircuitBreakerOptions) {
    this.failureThreshold = options?.failureThreshold ?? 5;
    this.cooldownPeriodMs = options?.cooldownPeriodMs ?? 5000;
    this.halfOpenMaxTrials = options?.halfOpenMaxTrials ?? 3;
  }

  /**
   * Calculates Full Jitter backoff (AWS pattern):
   * sleep = random_between(0, min(cap, base * 2^attempt))
   */
  public calculateFullJitter(attempt: number, baseMs = 100, capMs = 10000): number {
    const exponential = Math.min(capMs, baseMs * Math.pow(2, attempt));
    return Math.floor(Math.random() * exponential);
  }

  /**
   * Calculates Decorrelated Jitter backoff (AWS pattern):
   * sleep = min(cap, random_between(base, prevSleep * 3))
   */
  public calculateDecorrelatedJitter(prevSleepMs: number, baseMs = 100, capMs = 10000): number {
    const minVal = baseMs;
    const maxVal = Math.max(minVal, prevSleepMs * 3);
    const randomized = Math.floor(minVal + Math.random() * (maxVal - minVal));
    return Math.min(capMs, randomized);
  }

  /**
   * Evaluates circuit breaker state and cooldown expiration.
   */
  public getState(): CircuitBreakerState {
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastStateChange >= this.cooldownPeriodMs) {
        this.transitionTo('HALF_OPEN');
      }
    }
    return this.state;
  }

  public canExecute(): boolean {
    const currentState = this.getState();
    return currentState !== 'OPEN';
  }

  public recordSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.consecutiveSuccesses++;
      if (this.consecutiveSuccesses >= this.halfOpenMaxTrials) {
        this.transitionTo('CLOSED');
      }
    } else if (this.state === 'CLOSED') {
      this.consecutiveFailures = 0;
    }
  }

  public recordFailure(): void {
    const now = Date.now();
    this.lastFailureTime = now;
    this.consecutiveFailures++;

    if (this.state === 'HALF_OPEN') {
      // Immediate trip back to OPEN upon any probe failure
      this.transitionTo('OPEN');
    } else if (this.state === 'CLOSED') {
      if (this.consecutiveFailures >= this.failureThreshold) {
        this.transitionTo('OPEN');
      }
    }
  }

  public getTelemetry(): CircuitBreakerTelemetry {
    return {
      state: this.getState(),
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
      totalTripsToOpen: this.totalTrips,
      lastStateChangeTimestamp: this.lastStateChange,
      lastFailureTimestamp: this.lastFailureTime,
    };
  }

  public reset(): void {
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.lastStateChange = Date.now();
    this.lastFailureTime = null;
  }

  private transitionTo(newState: CircuitBreakerState): void {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();

    if (newState === 'OPEN') {
      this.totalTrips++;
      this.logger.warn(
        `Circuit Breaker TRIPPED: ${oldState} -> OPEN (failures=${this.consecutiveFailures})`
      );
    } else if (newState === 'HALF_OPEN') {
      this.consecutiveSuccesses = 0;
      this.logger.log(`Circuit Breaker cooldown elapsed: ${oldState} -> HALF_OPEN (canary probe active)`);
    } else if (newState === 'CLOSED') {
      this.consecutiveFailures = 0;
      this.consecutiveSuccesses = 0;
      this.logger.log(`Circuit Breaker recovered: ${oldState} -> CLOSED`);
    }
  }
}
