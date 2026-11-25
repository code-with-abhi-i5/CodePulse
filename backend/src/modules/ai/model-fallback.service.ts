import { Injectable, Logger } from '@nestjs/common';
import { ModelRouteResult } from '../../../src/types/ai';

@Injectable()
export class ModelFallbackService {
  private readonly logger = new Logger(ModelFallbackService.name);
  private failureCounters: Map<string, number> = new Map();

  public selectModel(providerHealth: { primaryUp: boolean; latencyP99Ms: number }): ModelRouteResult {
    // If primary cloud LLM is down or latency exceeds 4000ms, route to local LLaMA-3
    if (!providerHealth.primaryUp || providerHealth.latencyP99Ms > 4000) {
      return {
        modelName: 'llama3:8b-instruct-q4_K_M',
        provider: 'local-llama3',
        isFallback: true,
        latencyMs: 180
      };
    }

    return {
      modelName: 'claude-3-5-sonnet-20241022',
      provider: 'anthropic',
      isFallback: false,
      latencyMs: 650
    };
  }

  public recordFailure(provider: string): number {
    const count = (this.failureCounters.get(provider) || 0) + 1;
    this.failureCounters.set(provider, count);
    return count;
  }
}
