import test from 'node:test';
import assert from 'node:assert/strict';

class ContextWindowTruncationOptimizerService {
  optimizeContext(fullCode, maxTokensBudget) {
    const lines = fullCode.split('\n');
    const priorityLines = [];
    const omittedSections = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('import ') || trimmed.startsWith('export ') || trimmed.startsWith('function ')) {
        priorityLines.push(line);
      } else if (priorityLines.length * 4 < maxTokensBudget) {
        priorityLines.push(line);
      } else {
        if (!omittedSections.includes('internal details')) omittedSections.push('internal details');
      }
    }

    return {
      optimizedPrompt: priorityLines.join('\n'),
      totalTokensEstimate: Math.round(priorityLines.join('\n').length / 4),
      omittedSections
    };
  }
}

test('ContextWindowTruncationOptimizerService - preserves imports and signatures within budget', () => {
  const service = new ContextWindowTruncationOptimizerService();
  const code = 'import express from "express";\nexport function handler() {}\n' + 'const x = 1;\n'.repeat(50);
  const result = service.optimizeContext(code, 60);

  assert.ok(result.optimizedPrompt.includes('import express'));
  assert.ok(result.optimizedPrompt.includes('export function handler'));
  assert.ok(result.omittedSections.length > 0);
});
