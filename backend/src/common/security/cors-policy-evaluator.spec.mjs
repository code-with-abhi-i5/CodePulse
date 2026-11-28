import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class CorsPolicyEvaluatorService {
  constructor(
    allowedOrigins = ['https://codepulse.io', 'https://app.codepulse.io'],
    privatePathPrefix = '/api/private/'
  ) {
    this.allowedOrigins = allowedOrigins;
    this.privatePathPrefix = privatePathPrefix;
  }

  evaluateOrigin(origin, requestPath, allowCredentials = true) {
    const isPrivatePath = requestPath.startsWith(this.privatePathPrefix);

    if (origin === '*' && allowCredentials) {
      return {
        isAllowed: false,
        origin,
        allowCredentials: false,
        allowHeaders: [],
        rejectionReason: 'Wildcard origin "*" is strictly forbidden with credentials enabled'
      };
    }

    if (isPrivatePath) {
      if (!this.allowedOrigins.includes(origin)) {
        return {
          isAllowed: false,
          origin,
          allowCredentials: false,
          allowHeaders: [],
          rejectionReason: 'Origin "' + origin + '" is not authorized for private API endpoint ' + requestPath
        };
      }
    }

    const isExplicitlyAllowed = this.allowedOrigins.includes(origin);

    return {
      isAllowed: isExplicitlyAllowed,
      origin,
      allowCredentials: isExplicitlyAllowed ? allowCredentials : false,
      allowHeaders: isExplicitlyAllowed ? ['Content-Type', 'Authorization', 'X-Requested-With'] : [],
      rejectionReason: isExplicitlyAllowed ? undefined : 'Origin "' + origin + '" is not in CORS allowlist'
    };
  }
}

describe('CorsPolicyEvaluatorService', () => {
  const evaluator = new CorsPolicyEvaluatorService();

  it('blocks wildcard origin when credentials are enabled', () => {
    const result = evaluator.evaluateOrigin('*', '/api/public/status', true);
    assert.equal(result.isAllowed, false);
    assert.ok(result.rejectionReason.includes('strictly forbidden'));
  });

  it('approves legitimate allowed origins for private routes', () => {
    const result = evaluator.evaluateOrigin('https://app.codepulse.io', '/api/private/user', true);
    assert.equal(result.isAllowed, true);
    assert.equal(result.allowCredentials, true);
    assert.ok(result.allowHeaders.includes('Authorization'));
  });

  it('rejects unlisted external origins on private routes', () => {
    const result = evaluator.evaluateOrigin('https://malicious-site.com', '/api/private/user', true);
    assert.equal(result.isAllowed, false);
    assert.ok(result.rejectionReason.includes('not authorized'));
  });
});
