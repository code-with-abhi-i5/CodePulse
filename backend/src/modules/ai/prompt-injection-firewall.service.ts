import { FirewallInspectionResult } from '../../types/ai';

export class PromptInjectionFirewallService {
  private readonly dangerousPatterns = [
    { name: 'system_prompt_leak', regex: /(reveal|show|print|leak)\s+(the\s+)?(system\s+prompt|initial\s+instructions)/i },
    { name: 'instruction_override', regex: /ignore\s+(all\s+)?(previous|above)\s+instructions/i },
    { name: 'jailbreak_roleplay', regex: /you\s+are\s+now\s+(dan|an\s+evil\s+ai|unrestricted)/i },
    { name: 'delimiter_tampering', regex: /(<\|im_start\|>|<\|endoftext\|>|\[INST\])/i }
  ];

  inspect(prompt: string): FirewallInspectionResult {
    const matchedRules: string[] = [];

    for (const rule of this.dangerousPatterns) {
      if (rule.regex.test(prompt)) {
        matchedRules.push(rule.name);
      }
    }

    const isBlocked = matchedRules.length > 0;
    let threatLevel: 'none' | 'suspicious' | 'high' | 'critical' = 'none';

    if (matchedRules.length >= 2) threatLevel = 'critical';
    else if (matchedRules.length === 1) threatLevel = 'high';

    let sanitized = prompt;
    if (isBlocked) {
      for (const rule of this.dangerousPatterns) {
        sanitized = sanitized.replace(rule.regex, '[BLOCKED_INJECTION]');
      }
    }

    return {
      isBlocked,
      threatLevel,
      matchedRules,
      sanitizedPrompt: sanitized
    };
  }
}
