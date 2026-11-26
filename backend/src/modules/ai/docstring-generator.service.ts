import { DocstringResult } from '../../types/ai';

export class DocstringGeneratorService {
  generateDocstring(code: string): DocstringResult {
    const lines = code.split('\n');
    const inferredParams: Array<{ name: string; type: string; description: string }> = [];
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
    if (inferredParams.length > 0) {
      md += '| Parameter | Type | Description |\n|---|---|---|\n';
      for (const p of inferredParams) {
        md += '| ' + p.name + ' | ' + p.type + ' | ' + p.description + '|\n';
      }
    }

    return {
      tsDoc,
      markdownDoc: md,
      inferredParams,
      returnType
    };
  }
}
