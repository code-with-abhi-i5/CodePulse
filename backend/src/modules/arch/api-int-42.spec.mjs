import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ApiMockServerGeneratorService } from './api-int-42.service.ts';

describe('ApiMockServerGeneratorService (API-INT-42)', () => {
  it('synthesizes mock payload responses matching schema property types', () => {
    const generator = new ApiMockServerGeneratorService();
    const mock = generator.generateMock({
      id: { type: 'string', example: 'uuid-123' },
      score: { type: 'number' },
      active: { type: 'boolean' }
    });

    assert.strictEqual(mock.id, 'uuid-123');
    assert.strictEqual(mock.score, 42);
    assert.strictEqual(mock.active, true);
  });
});
