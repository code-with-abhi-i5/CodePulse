import test from 'node:test';
import assert from 'node:assert/strict';

class SpecComplianceChecker {
  verifyHandlerCompliance(spec, handlerHeaders, handlerBodyKeys, handlerResponses) {
    const missingHeaders = (spec.requiredHeaders || []).filter(h => !handlerHeaders.includes(h.toLowerCase()));
    const missingBodyParams = (spec.requiredBodyParams || []).filter(p => !handlerBodyKeys.includes(p));
    const invalidResponses = handlerResponses.filter(r => !spec.expectedResponses.includes(r));

    let penalty = (missingHeaders.length * 20) + (missingBodyParams.length * 20) + (invalidResponses.length * 15);
    const score = Math.max(0, 100 - penalty);

    return {
      isCompliant: score >= 90 && missingHeaders.length === 0 && missingBodyParams.length === 0,
      missingHeaders,
      missingBodyParams,
      invalidResponses,
      scorePercent: score
    };
  }
}

test('SpecComplianceChecker - verifies API handler compliance with OpenAPI spec', () => {
  const checker = new SpecComplianceChecker();
  const spec = {
    path: '/api/v1/battle/submit',
    method: 'POST',
    requiredHeaders: ['authorization', 'content-type'],
    requiredBodyParams: ['code', 'language'],
    expectedResponses: [200, 400, 401, 500]
  };

  const compliant = checker.verifyHandlerCompliance(spec, ['authorization', 'content-type'], ['code', 'language'], [200, 400]);
  assert.strictEqual(compliant.isCompliant, true);
  assert.strictEqual(compliant.scorePercent, 100);

  const missing = checker.verifyHandlerCompliance(spec, ['authorization'], ['code'], [200, 418]);
  assert.strictEqual(missing.isCompliant, false);
  assert.strictEqual(missing.missingHeaders.includes('content-type'), true);
  assert.strictEqual(missing.missingBodyParams.includes('language'), true);
  assert.strictEqual(missing.invalidResponses.includes(418), true);
});
