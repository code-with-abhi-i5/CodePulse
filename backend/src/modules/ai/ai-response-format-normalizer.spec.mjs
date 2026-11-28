import test from 'node:test';
import assert from 'node:assert/strict';

class AiResponseFormatNormalizer {
  normalizeResponse(rawResponse) {
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const extractedCodeBlocks = [];

    let match;
    while ((match = codeBlockRegex.exec(rawResponse)) !== null) {
      extractedCodeBlocks.push({
        language: match[1] || 'text',
        code: match[2].trim()
      });
    }

    return {
      markdown: rawResponse.trim(),
      extractedCodeBlocks,
      isProperlyStructured: extractedCodeBlocks.length > 0
    };
  }
}

test('AiResponseFormatNormalizer - extracts structured code blocks from LLM markdown', () => {
  const normalizer = new AiResponseFormatNormalizer();
  const text = 'Here is the solution:\n```typescript\nconst x: number = 42;\n```\nEnjoy!';
  const res = normalizer.normalizeResponse(text);

  assert.strictEqual(res.isProperlyStructured, true);
  assert.strictEqual(res.extractedCodeBlocks.length, 1);
  assert.strictEqual(res.extractedCodeBlocks[0].language, 'typescript');
  assert.strictEqual(res.extractedCodeBlocks[0].code, 'const x: number = 42;');
});
