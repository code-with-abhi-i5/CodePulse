import { AbVariant, AbTestEvaluation } from '../../types/ai';

export class PromptAbTestingRouter {
  private variants: AbVariant[] = [];

  constructor(variants: AbVariant[]) {
    this.variants = variants;
  }

  routeRequest(userId: string): AbVariant {
    if (this.variants.length === 0) throw new Error('No variants configured');
    const hash = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const index = hash % this.variants.length;
    return this.variants[index];
  }

  recordResult(variantId: string, modelName: string, passed: boolean, latencyMs: number): AbTestEvaluation {
    return {
      selectedVariantId: variantId,
      modelName,
      completionPassed: passed,
      latencyMs
    };
  }
}
