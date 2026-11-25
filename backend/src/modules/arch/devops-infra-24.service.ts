/**
 * Architecture Service: Git Secret Scrubber Pipeline
 * Subsystem: Advanced DevOps & Infrastructure Automation [DEVOPS-INFRA-24]
 */

export interface SecretLeakDetection {
  leakFound: boolean;
  ruleName?: string;
  matchedStringPreview?: string;
}

export class GitSecretScrubberService {
  private static readonly PATTERNS = [
    { rule: 'AWS_ACCESS_KEY', regex: /AKIA[0-9A-Z]{16}/ },
    { rule: 'GITHUB_PAT', regex: /ghp_[a-zA-Z0-9]{36}/ },
    { rule: 'PRIVATE_KEY', regex: /-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----/ },
    { rule: 'SLACK_TOKEN', regex: /xox[baprs]-[0-9a-zA-Z]{10,48}/ }
  ];

  public scanContent(diffText: string): SecretLeakDetection {
    for (const p of GitSecretScrubberService.PATTERNS) {
      const match = diffText.match(p.regex);
      if (match) {
        return {
          leakFound: true,
          ruleName: p.rule,
          matchedStringPreview: match[0].substring(0, 8) + '...'
        };
      }
    }

    return { leakFound: false };
  }
}
