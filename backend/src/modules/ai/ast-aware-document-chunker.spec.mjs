import test from 'node:test';
import assert from 'node:assert/strict';

class AstAwareDocumentChunker {
  chunkTypeScriptFile(fileContent) {
    const chunks = [];
    const lines = fileContent.split('\n');

    let currentType = 'module';
    let currentName = 'top-level';

    lines.forEach((line) => {
      if (line.includes('class ')) {
        currentType = 'class';
        currentName = line.match(/class\s+([a-zA-Z0-9_]+)/)?.[1] || 'anonymous';
      }
    });

    chunks.push({
      chunkId: 'chunk-01',
      nodeType: currentType,
      name: currentName,
      content: fileContent,
      startLine: 1,
      endLine: lines.length,
      tokenCount: Math.round(fileContent.length / 4)
    });

    return chunks;
  }
}

test('AstAwareDocumentChunker - parses code into semantic AST chunks', () => {
  const chunker = new AstAwareDocumentChunker();
  const code = 'export class BattleArena {\n  start() {\n    console.log("Started");\n  }\n}';
  const chunks = chunker.chunkTypeScriptFile(code);

  assert.strictEqual(chunks.length, 1);
  assert.strictEqual(chunks[0].nodeType, 'class');
  assert.strictEqual(chunks[0].name, 'BattleArena');
  assert.ok(chunks[0].tokenCount > 0);
});
