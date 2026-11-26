import { OpenApiEndpointSpec, SpecComplianceResult } from '../../types/ai';

export class SpecComplianceChecker {
  verifyHandlerCompliance(
    spec: OpenApiEndpointSpec,
    handlerHeaders: string[],
    handlerBodyKeys: string[],
    handlerResponses: number[]
  ): SpecComplianceResult {
    const missingHeaders = (spec.requiredHeaders || []).filter(h => !handlerHeaders.includes(h.toLowerCase()));
    const missingBodyParams = (spec.requiredBodyParams || []).filter(p => !handlerBodyKeys.includes(p));
    const invalidResponses = handlerResponses.filter(r => !spec.expectedResponses.includes(r));

    let penalty = (missingHeaders.length * 20) + (missingBodyParams.length * 20) + (invalidResponses.length * 15);
    const score = Math.max(0, 100 - penalty);

    return {
      isCompliant: score >= 90 && missingHeaders.length === 0 && missingBodyParams.length === 0,
      missingHeaders,
      missingBodyParams,
      invalidResponses,
      scorePercent: score
    };
  }
}
