/**
 * Architecture Service: Interface Code Snippet Generator
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-33]
 */

export class InterfaceCodeSnippetGeneratorService {
  public generateMockSnippet(interfaceName: string, interfaceCode: string): string {
    const lines = interfaceCode.split('\n');
    const fields: Array<{ name: string; type: string }> = [];

    for (const line of lines) {
      const match = line.match(/^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\??\s*:\s*([^;]+);/);
      if (match) {
        fields.push({ name: match[1], type: match[2].trim() });
      }
    }

    const stubs = fields.map(f => {
      let defaultVal = 'null';
      if (f.type.includes('[]')) defaultVal = '[]';
      else if (f.type.includes('string')) defaultVal = "''";
      else if (f.type.includes('number')) defaultVal = '0';
      else if (f.type.includes('boolean')) defaultVal = 'false';
      return `  ${f.name}: ${defaultVal}`;
    });

    return [
      `const mock${interfaceName}: ${interfaceName} = {`,
      stubs.join(',\n'),
      `};`
    ].join('\n');
  }
}
