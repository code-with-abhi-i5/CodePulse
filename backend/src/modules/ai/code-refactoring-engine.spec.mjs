import test from 'node:test';
import assert from 'node:assert/strict';

class CodeRefactoringEngineService {
  analyzeAndRefactor(code) {
    const smells = [];
    let refactored = code;

    if (/for\s*\([^{]+\)\s*\{[^}]*\.indexOf\(/s.test(code)) {
      smells.push({ ruleId: 'PERF-001', severity: 'high' });
      refactored = refactored.replace(/\.indexOf\(([^)]+)\)\s*!==\s*-1/g, '.has($1)');
    }

    if (/\bvar\s+(\w+)/.test(code)) {
      smells.push({ ruleId: 'STYLE-003', severity: 'low' });
      refactored = refactored.replace(/\bvar\s+/g, 'const ');
    }

    return {
      smellsDetected: smells,
      refactoredCode: refactored,
      optimizationSummary: 'Detected ' + smells.length + ' smell(s).'
    };
  }
}

test('CodeRefactoringEngineService - detects anti-patterns and refactors var to const', () => {
  const service = new CodeRefactoringEngineService();
  const raw = 'var items = [1, 2, 3]; for (var i = 0; i < items.length; i++) { list.indexOf(items[i]) !== -1; }';
  const result = service.analyzeAndRefactor(raw);

  assert.ok(result.smellsDetected.some(s => s.ruleId === 'PERF-001'));
  assert.ok(result.smellsDetected.some(s => s.ruleId === 'STYLE-003'));
  assert.ok(result.refactoredCode.includes('const items'));
});
