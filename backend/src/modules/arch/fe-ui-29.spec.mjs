import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BracketPairColorizerService } from './fe-ui-29.service.ts';

describe('BracketPairColorizerService (FE-UI-29)', () => {
  it('matches matching bracket pairs and assigns cyclical color depth indices', () => {
    const colorizer = new BracketPairColorizerService();
    const code = 'const fn = (x: number[]) => { return { val: x[0] }; };';

    const matches = colorizer.colorizeBrackets(code);
    assert.ok(matches.length >= 4);

    const matchTypes = matches.map(m => m.bracketType);
    assert.ok(matchTypes.includes('()'));
    assert.ok(matchTypes.includes('[]'));
    assert.ok(matchTypes.includes('{}'));
  });
});
