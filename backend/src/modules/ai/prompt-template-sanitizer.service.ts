import { SanitizedPrompt } from '../../types/ai';

export class PromptTemplateSanitizerService {
  private readonly forbiddenControlTokens = [
    '<|im_start|>',
    '<|im_end|>',
    '<|endoftext|>',
    '[INST]',
    '[/INST]',
    '<<SYS>>',
    '<</SYS>>'
  ];

  sanitizeVariable(input: string): SanitizedPrompt {
    let sanitized = input;
    const stripped: string[] = [];
    let injections = 0;

    for (const token of this.forbiddenControlTokens) {
      if (sanitized.includes(token)) {
        stripped.push(token);
        injections++;
        sanitized = sanitized.split(token).join('');
      }
    }

    const injectionPatterns = [
      /ignore all previous instructions/gi,
      /reveal system prompt/gi,
      /you are now in developer mode/gi
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(sanitized)) {
        injections++;
        sanitized = sanitized.replace(pattern, '[REDACTED_ATTEMPT]');
      }
    }

    return {
      sanitizedText: sanitized.trim(),
      strippedTokens: stripped,
      injectionAttemptsDetected: injections
    };
  }
}
