/**
 * Architecture Service: API Mock Server Generator
 * Subsystem: Testing Infrastructure & Schema Mocking
 */

export interface SchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array';
  example?: unknown;
}

export class ApiMockServerGeneratorService {
  public generateMock(schema: Record<string, SchemaProperty>): Record<string, unknown> {
    const mock: Record<string, unknown> = {};

    for (const [key, prop] of Object.entries(schema)) {
      if (prop.example !== undefined) {
        mock[key] = prop.example;
        continue;
      }

      switch (prop.type) {
        case 'string': mock[key] = `sample-${key}`; break;
        case 'number': mock[key] = 42; break;
        case 'boolean': mock[key] = true; break;
        case 'array': mock[key] = []; break;
      }
    }
    return mock;
  }
}
