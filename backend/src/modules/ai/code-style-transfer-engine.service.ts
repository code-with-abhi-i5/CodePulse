import { PrettierConfigRule, StyleTransferResult } from '../../types/ai';

export class CodeStyleTransferEngine {
  alignStyle(code: string, config: PrettierConfigRule): StyleTransferResult {
    let formatted = code;
    let replacements = 0;

    // Single quotes vs double quotes
    if (config.singleQuote) {
      formatted = formatted.replace(/"([^"\\]*)"/g, (match, p1) => {
        replacements++;
        return `'${p1}'`;
      });
    }

    // Semicolon enforcement
    if (config.semi) {
      formatted = formatted.split('\n').map(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}') && !trimmed.startsWith('//')) {
          replacements++;
          return line + ';';
        }
        return line;
      }).join('\n');
    }

    return {
      formattedCode: formatted,
      replacementsCount: replacements,
      compliant: true
    };
  }
}
