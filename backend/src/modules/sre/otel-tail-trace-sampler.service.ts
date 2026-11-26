import { SpanData, TailSamplingDecision } from '../../types/sre';

export class OtelTailTraceSampler {
  private readonly latencyThresholdMs: number = 500;
  private readonly baseSampleRate: number = 0.05; // 5% for normal spans

  evaluateSpan(span: SpanData): TailSamplingDecision {
    if (span.hasError || (span.httpStatusCode && span.httpStatusCode >= 500)) {
      return { sample: true, reason: 'error' };
    }

    if (span.durationMs >= this.latencyThresholdMs) {
      return { sample: true, reason: 'high_latency' };
    }

    // Hash traceId to determine deterministic sample
    const hash = span.traceId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const isSampled = (hash % 100) < (this.baseSampleRate * 100);

    return {
      sample: isSampled,
      reason: isSampled ? 'probabilistic' : 'dropped'
    };
  }
}
