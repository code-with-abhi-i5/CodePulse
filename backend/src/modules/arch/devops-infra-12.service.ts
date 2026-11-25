/**
 * Architecture Service: Git Pre-Commit Hook Enforcer
 * Subsystem: Advanced DevOps & Infrastructure Automation [DEVOPS-INFRA-12]
 */

export interface CommitValidationResult {
  isValid: boolean;
  type?: string;
  scope?: string;
  error?: string;
}

export class GitPreCommitHookEnforcerService {
  private allowedTypes: Set<string>;

  constructor(allowedTypes: string[] = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'build', 'ci']) {
    this.allowedTypes = new Set(allowedTypes);
  }

  public validateCommitMessage(message: string): CommitValidationResult {
    const trimmed = message.trim();
    if (!trimmed) {
      return { isValid: false, error: 'Commit message cannot be empty' };
    }

    const firstLine = trimmed.split('\n')[0];
    const match = firstLine.match(/^(\w+)(?:\(([^)]+)\))?!?\s*:\s*(.+)$/);

    if (!match) {
      return { isValid: false, error: 'Commit message must follow conventional format: type(scope): subject' };
    }

    const [, type, scope, subject] = match;
    if (!this.allowedTypes.has(type.toLowerCase())) {
      return { isValid: false, error: 'Invalid commit type: ' + type + '. Must be one of: ' + Array.from(this.allowedTypes).join(', ') };
    }

    if (!subject || subject.trim().length < 3) {
      return { isValid: false, error: 'Commit subject must be at least 3 characters long' };
    }

    return {
      isValid: true,
      type: type.toLowerCase(),
      scope: scope || undefined
    };
  }
}
