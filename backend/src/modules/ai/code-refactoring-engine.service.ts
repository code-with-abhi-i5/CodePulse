import { RefactoringResult, RefactoringSmell } from '../../types/ai';

export class CodeRefactoringEngineService {
  analyzeAndRefactor(code: string): RefactoringResult {
    const smells: RefactoringSmell[] = [];
    let refactored = code;

    if (/for\s*\([^{]+\)\s*\{[^}]*\.indexOf\(/s.test(code)) {
      smells.push({
        ruleId: 'PERF-001',
        severity: 'high',
        line: 1,
        description: 'Quadratic O(N^2) complexity: Array.indexOf invoked inside loop.',
        suggestedFix: 'Pre-index elements into a Set or Map for O(1) membership testing.'
      });
      refactored = refactored.replace(/\.indexOf\(([^)]+)\)\s*!==\s*-1/g, '.has($1)');
    }

    if (/(\w+\s*\+=\s*["'][^"']*["'];\s*){3,}/.test(code)) {
      smells.push({
        ruleId: 'PERF-002',
        severity: 'medium',
        line: 1,
        description: 'Repeated string concatenation causes repeated memory allocations.',
        suggestedFix: 'Use Array.push() and join() or template literals.'
      });
    }

    if (/\bvar\s+(\w+)/.test(code)) {
      smells.push({
        ruleId: 'STYLE-003',
        severity: 'low',
        line: 1,
        description: 'Legacy var keyword detected. Prone to hoisting errors.',
        suggestedFix: 'Replace var with const or let.'
      });
      refactored = refactored.replace(/\bvar\s+/g, 'const ');
    }

    return {
      smellsDetected: smells,
      refactoredCode: refactored,
      optimizationSummary: 'Detected ' + smells.length + ' smell(s).'
    };
  }
}
