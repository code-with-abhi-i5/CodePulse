import assert from 'node:assert/strict';
import test from 'node:test';

class McpServerService {
  constructor() {
    this.tools = new Map();
    this.registerTool({
      name: 'analyze_ast',
      description: 'Parses code and returns AST metrics',
      parameters: {}
    });
  }

  registerTool(tool) {
    this.tools.set(tool.name, tool);
  }

  listTools() {
    return Array.from(this.tools.values());
  }

  async executeTool(toolName, args) {
    if (!this.tools.has(toolName)) throw new Error('Not found');
    return { success: true, result: { tool: toolName } };
  }
}

test('McpServerService: exposes code analysis tools via Model Context Protocol', async () => {
  const mcp = new McpServerService();
  const tools = mcp.listTools();
  assert.equal(tools.length, 1);
  assert.equal(tools[0].name, 'analyze_ast');

  const res = await mcp.executeTool('analyze_ast', { code: 'let x = 1;' });
  assert.equal(res.success, true);
  assert.equal(res.result.tool, 'analyze_ast');
});
