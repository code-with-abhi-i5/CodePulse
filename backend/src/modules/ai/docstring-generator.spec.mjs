import test from 'node:test';
import assert from 'node:assert/strict';

class DocstringGeneratorService {
  generateDocstring(code) {
    const inferredParams = [];
    let returnType = 'void';

    const funcMatch = code.match(/(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\()\s*\(([^)]*)\)(?:\s*:\s*([^\{\=]+))?/);
    const funcName = funcMatch ? (funcMatch[1] || funcMatch[2] || 'anonymous') : 'anonymous';

    if (funcMatch && funcMatch[3]) {
      const rawParams = funcMatch[3].split(',');
      for (const p of rawParams) {
        const parts = p.trim().split(':');
        if (parts[0]) {
          const pName = parts[0].trim();
          const pType = parts[1] ? parts[1].trim() : 'any';
          inferredParams.push({
            name: pName,
            type: pType,
            description: 'The ' + pName + ' argument'
          });
        }
      }
    }

    if (funcMatch && funcMatch[4]) {
      returnType = funcMatch[4].trim();
    }

    let tsDoc = '/**\n';
    tsDoc += ' * Synthesized documentation for ' + funcName + '\n';
    tsDoc += ' *\n';
    for (const param of inferredParams) {
      tsDoc += ' * @param ' + param.name + ' {' + param.type + '} ' + param.description + '\n';
    }
    tsDoc += ' * @returns {' + returnType + '} Calculated result\n';
    tsDoc += ' */';

    let md = '### ' + funcName + '\n\n';
    md += '**Returns**: ' + returnType + '\n\n';

    return { tsDoc, markdownDoc: md, inferredParams, returnType };
  }
}

test('DocstringGeneratorService - synthesizes TSDoc and markdown from signatures', () => {
  const service = new DocstringGeneratorService();
  const code = 'function calculateTotal(price: number, taxRate: number): number { return price * (1 + taxRate); }';
  const result = service.generateDocstring(code);

  assert.ok(result.tsDoc.includes('@param price {number}'));
  assert.ok(result.tsDoc.includes('@param taxRate {number}'));
  assert.ok(result.tsDoc.includes('@returns {number}'));
  assert.equal(result.returnType, 'number');
  assert.equal(result.inferredParams.length, 2);
  assert.ok(result.markdownDoc.includes('### calculateTotal'));
});
