import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ApiCorsDynamicOriginValidatorService } from './api-int-55.service.ts';

describe('ApiCorsDynamicOriginValidatorService (API-INT-55)', () => {
  it('validates origins against dynamic regex patterns', () => {
    const cors = new ApiCorsDynamicOriginValidatorService();
    cors.addAllowedPattern(new RegExp('^https://([a-z0-9-]+[.])?codepulse[.]io$'));
    cors.addAllowedPattern(new RegExp('^http://localhost:[0-9]+$'));

    assert.strictEqual(cors.isOriginAllowed('https://codepulse.io'), true);
    assert.strictEqual(cors.isOriginAllowed('https://staging.codepulse.io'), true);
    assert.strictEqual(cors.isOriginAllowed('http://localhost:3000'), true);
    assert.strictEqual(cors.isOriginAllowed('https://evil-codepulse.io'), false);
  });
});
