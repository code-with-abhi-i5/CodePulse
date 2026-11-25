import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ApiDocumentationTryItOutService } from './api-int-38.service.ts';

describe('ApiDocumentationTryItOutService (API-INT-38)', () => {
  it('issues test sandbox tokens and executes simulated doc requests safely', () => {
    const runner = new ApiDocumentationTryItOutService();
    const token = runner.issueSandboxToken();

    const res1 = runner.executeTestRequest(token, '/api/v1/challenges', 'GET');
    assert.strictEqual(res1.allowed, true);
    assert.strictEqual(res1.status, 200);

    const res2 = runner.executeTestRequest('bad-token', '/api/v1/challenges', 'GET');
    assert.strictEqual(res2.allowed, false);
    assert.strictEqual(res2.status, 401);
  });
});
