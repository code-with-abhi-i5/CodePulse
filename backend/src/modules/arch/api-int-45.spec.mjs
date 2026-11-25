import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GraphqlInputValidatorPipeService } from './api-int-45.service.ts';

describe('GraphqlInputValidatorPipeService (API-INT-45)', () => {
  it('validates input object constraints and accumulates descriptive error messages', () => {
    const pipe = new GraphqlInputValidatorPipeService();
    const rules = {
      title: { required: true, minLength: 5 },
      difficultyScore: { min: 1 }
    };

    const invalid = pipe.validateInput({ title: 'Hi', difficultyScore: 0 }, rules);
    assert.strictEqual(invalid.valid, false);
    assert.strictEqual(invalid.errors.length, 2);

    const valid = pipe.validateInput({ title: 'Valid Title', difficultyScore: 5 }, rules);
    assert.strictEqual(valid.valid, true);
  });
});
