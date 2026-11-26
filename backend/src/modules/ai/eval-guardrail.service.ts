import { Injectable, Logger } from '@nestjs/common';
import { GuardrailEvaluation } from '../../../src/types/ai';

@Injectable()
export class EvalGuardrailService {
  private readonly logger = new Logger(EvalGuardrailService.name);
  private bannedPatterns = [
    /ignore previous instructions/i,
    /you are now DAN/i,
    /system prompt override/i,
    /reveal hidden test cases/i,
    /format c:/i
  ];

  public sanitizePrompt(input: string): GuardrailEvaluation {
    const stripped: string[] = [];
    let clean = input;

    for (const pat of this.bannedPatterns) {
      if (pat.test(clean)) {
        stripped.push(pat.source);
        clean = clean.replace(pat, '[REDACTED_BY_GUARDRAIL]');
      }
    }

    const isSafe = stripped.length === 0;
    const riskScore = stripped.length * 40;

    return {
      isSafe,
      sanitizedPrompt: clean,
      strippedPatterns: stripped,
      riskScore: Math.min(100, riskScore)
    };
  }
}
