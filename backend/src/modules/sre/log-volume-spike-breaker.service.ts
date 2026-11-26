import { LogEvent, LogThrottleDecision } from '../../types/sre';

export class LogVolumeSpikeBreaker {
  private maxLogsPerSecond: number;
  private currentSecond: number = 0;
  private logCountThisSecond: number = 0;

  constructor(maxLogsPerSecond: number = 500) {
    this.maxLogsPerSecond = maxLogsPerSecond;
  }

  evaluate(event: LogEvent): LogThrottleDecision {
    const sec = Math.floor(event.timestamp / 1000);
    if (sec !== this.currentSecond) {
      this.currentSecond = sec;
      this.logCountThisSecond = 0;
    }

    this.logCountThisSecond++;

    // Critical error and fatal logs always pass through
    if (event.level === 'error' || event.level === 'fatal') {
      return { shouldLog: true, isThrottled: false, activeRate: this.logCountThisSecond };
    }

    const isThrottled = this.logCountThisSecond > this.maxLogsPerSecond;
    return {
      shouldLog: !isThrottled,
      isThrottled,
      activeRate: this.logCountThisSecond
    };
  }
}
