/**
 * Architecture Service: Interactive API Documentation Try-It-Out Runner
 * Subsystem: Developer Experience & Sandbox API Testing
 */

export interface TestExecutionResult {
  allowed: boolean;
  mocked: boolean;
  status: number;
  data: unknown;
}

export class ApiDocumentationTryItOutService {
  private readonly sandboxTokens = new Set<string>();

  public issueSandboxToken(): string {
    const token = 'sandbox_tok_' + Math.random().toString(36).substring(2, 10);
    this.sandboxTokens.add(token);
    return token;
  }

  public executeTestRequest(token: string, endpoint: string, method: string): TestExecutionResult {
    if (!this.sandboxTokens.has(token)) {
      return { allowed: false, mocked: false, status: 401, data: { error: 'Invalid sandbox test token' } };
    }

    return {
      allowed: true,
      mocked: true,
      status: 200,
      data: { message: `Mock response for ${method} ${endpoint}`, timestamp: Date.now() }
    };
  }
}
