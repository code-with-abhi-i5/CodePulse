import { FallbackRoutingResult } from '../../types/ai';

export class MultiModelFallbackRouterService {
  private readonly maxLatencyThresholdMs = 2500;

  routeRequest(primaryModel: string, fallbackModel: string, currentLatencyMs: number, circuitBroken: boolean): FallbackRoutingResult {
    if (circuitBroken) {
      return {
        routedModel: fallbackModel,
        isFallback: true,
        reason: 'error_circuit_open'
      };
    }

    if (currentLatencyMs > this.maxLatencyThresholdMs) {
      return {
        routedModel: fallbackModel,
        isFallback: true,
        reason: 'latency_spike'
      };
    }

    return {
      routedModel: primaryModel,
      isFallback: false,
      reason: 'primary_healthy'
    };
  }
}
