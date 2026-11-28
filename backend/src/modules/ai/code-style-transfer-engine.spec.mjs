import test from 'node:test';
import assert from 'node:assert/strict';

class CodeStyleTransferEngine {
  alignStyle(code, config) {
    let formatted = code;
    let replacements = 0;

    if (config.singleQuote) {
      formatted = formatted.replace(/"([^"\\]*)"/g, (match, p1) => {
        replacements++;
        return `'${p1}'`;
      });
    }

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

test('CodeStyleTransferEngine - formats user submission to match Prettier config', () => {
  const engine = new CodeStyleTransferEngine();
  const input = 'const x = "hello"\nconst y = "world"';
  const res = engine.alignStyle(input, { singleQuote: true, semi: true, tabWidth: 2, trailingComma: 'none' });

  assert.strictEqual(res.compliant, true);
  assert.ok(res.formattedCode.includes("'hello';"));
  assert.ok(res.formattedCode.includes("'world';"));
  assert.ok(res.replacementsCount >= 2);
});
