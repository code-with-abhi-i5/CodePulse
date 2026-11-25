/**
 * Architecture Service: Asynchronous Task Queue Backpressure Regulator
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-43]
 */

export const BackpressureState = {
  NORMAL: 'NORMAL',
  THROTTLED: 'THROTTLED',
  PAUSED: 'PAUSED'
} as const;
export type BackpressureState = typeof BackpressureState[keyof typeof BackpressureState];

export interface RegulatorConfig {
  highWatermark: number;
  lowWatermark: number;
  throttleWatermark: number;
}

export class TaskQueueBackpressureRegulatorService {
  private config: RegulatorConfig;
  private currentQueueDepth: number;
  private state: BackpressureState;

  constructor(config?: Partial<RegulatorConfig>) {
    this.config = {
      highWatermark: config?.highWatermark ?? 1000,
      lowWatermark: config?.lowWatermark ?? 300,
      throttleWatermark: config?.throttleWatermark ?? 750
    };
    this.currentQueueDepth = 0;
    this.state = BackpressureState.NORMAL;
  }

  public recordEnqueued(): BackpressureState {
    this.currentQueueDepth++;
    if (this.currentQueueDepth >= this.config.highWatermark) {
      this.state = BackpressureState.PAUSED;
    } else if (this.currentQueueDepth >= this.config.throttleWatermark) {
      this.state = BackpressureState.THROTTLED;
    }
    return this.state;
  }

  public recordDequeued(): BackpressureState {
    if (this.currentQueueDepth > 0) {
      this.currentQueueDepth--;
    }

    if (this.currentQueueDepth <= this.config.lowWatermark) {
      this.state = BackpressureState.NORMAL;
    } else if (this.currentQueueDepth < this.config.highWatermark && this.state === BackpressureState.PAUSED) {
      this.state = BackpressureState.THROTTLED;
    }
    return this.state;
  }

  public shouldAdmit(): boolean {
    return this.state !== BackpressureState.PAUSED;
  }

  public getState(): BackpressureState {
    return this.state;
  }

  public getDepth(): number {
    return this.currentQueueDepth;
  }
}
