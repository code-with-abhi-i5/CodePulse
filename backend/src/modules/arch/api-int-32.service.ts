/**
 * Architecture Service: MCP Tool Sandbox Execution
 * Subsystem: AI Agent Tool Governance & Security
 */

export interface ToolExecutionAudit {
  toolName: string;
  callerId: string;
  granted: boolean;
  timestamp: number;
}

export class McpToolSandboxExecutionService {
  private readonly allowedTools = new Set<string>();
  private readonly auditLog: ToolExecutionAudit[] = [];

  public grantTool(toolName: string): void {
    this.allowedTools.add(toolName);
  }

  public revokeTool(toolName: string): void {
    this.allowedTools.delete(toolName);
  }

  public executeTool(toolName: string, callerId: string, runFn: () => unknown): { success: boolean; result?: unknown; error?: string } {
    const granted = this.allowedTools.has(toolName);
    this.auditLog.push({ toolName, callerId, granted, timestamp: Date.now() });

    if (!granted) {
      return { success: false, error: `Tool ${toolName} is not permitted for execution` };
    }

    try {
      const result = runFn();
      return { success: true, result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  }

  public getAuditLog(): ToolExecutionAudit[] {
    return [...this.auditLog];
  }
}
