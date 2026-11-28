import test from 'node:test';
import assert from 'node:assert/strict';

class CodeTranslationPipeline {
  translatePythonToTypescript(pythonCode) {
    let tsCode = pythonCode
      .replace(/def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\):/g, 'function $1($2): any {')
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\bNone\b/g, 'null')
      .replace(/print\((.*)\)/g, 'console.log($1);');

    if (tsCode.includes('function ') && !tsCode.endsWith('}')) {
      tsCode += '\n}';
    }

    return {
      sourceLanguage: 'python',
      targetLanguage: 'typescript',
      translatedCode: tsCode,
      typeHintsAdded: true
    };
  }
}

test('CodeTranslationPipeline - translates Python challenge functions into TypeScript syntax', () => {
  const pipeline = new CodeTranslationPipeline();
  const py = 'def solve(arr):\n    return True';
  const ts = pipeline.translatePythonToTypescript(py);

  assert.strictEqual(ts.targetLanguage, 'typescript');
  assert.ok(ts.translatedCode.includes('function solve(arr): any {'));
  assert.ok(ts.translatedCode.includes('return true'));
});
