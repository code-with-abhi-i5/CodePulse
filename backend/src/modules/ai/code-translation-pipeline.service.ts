import { CodeTranslationResult } from '../../types/ai';

export class CodeTranslationPipeline {
  translatePythonToTypescript(pythonCode: string): CodeTranslationResult {
    let tsCode = pythonCode
      .replace(/def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\):/g, 'function $1($2): any {')
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\bNone\b/g, 'null')
      .replace(/print\((.*)\)/g, 'console.log($1);');

    // Close function bracket if opened
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
