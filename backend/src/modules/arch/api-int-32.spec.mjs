import { describe, it } from 'node:test';
import assert from 'node:assert';
import { McpToolSandboxExecutionService } from './api-int-32.service.ts';

describe('McpToolSandboxExecutionService (API-INT-32)', () => {
  it('enforces granular tool execution authorization and logs audit events', () => {
    const sandbox = new McpToolSandboxExecutionService();
    sandbox.grantTool('read_challenge');

    const res1 = sandbox.executeTool('read_challenge', 'agent-1', () => 'challenge-data');
    assert.strictEqual(res1.success, true);
    assert.strictEqual(res1.result, 'challenge-data');

    const res2 = sandbox.executeTool('delete_challenge', 'agent-1', () => null);
    assert.strictEqual(res2.success, false);

    assert.strictEqual(sandbox.getAuditLog().length, 2);
  });
});
