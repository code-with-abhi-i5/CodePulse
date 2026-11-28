import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class OpenRedirectValidatorService {
  constructor(allowedHosts = ['codepulse.io', 'app.codepulse.io', 'auth.codepulse.io']) {
    this.allowedHosts = allowedHosts;
  }

  validateRedirectUrl(targetUrl, defaultFallback = '/dashboard') {
    if (targetUrl.startsWith('//') || targetUrl.startsWith('\\\\')) {
      return {
        isSafe: false,
        sanitizedUrl: defaultFallback,
        reason: 'Protocol-relative URL is not permitted'
      };
    }

    if (targetUrl.startsWith('/') && !targetUrl.startsWith('//')) {
      return {
        isSafe: true,
        sanitizedUrl: targetUrl
      };
    }

    try {
      const parsed = new URL(targetUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return {
          isSafe: false,
          sanitizedUrl: defaultFallback,
          reason: 'Protocol "' + parsed.protocol + '" is not permitted'
        };
      }

      if (!this.allowedHosts.includes(parsed.hostname.toLowerCase())) {
        return {
          isSafe: false,
          sanitizedUrl: defaultFallback,
          reason: 'Host "' + parsed.hostname + '" is not in open redirect allowlist'
        };
      }

      return {
        isSafe: true,
        sanitizedUrl: targetUrl
      };
    } catch {
      return {
        isSafe: false,
        sanitizedUrl: defaultFallback,
        reason: 'Malformed redirect URL'
      };
    }
  }
}

describe('OpenRedirectValidatorService', () => {
  const validator = new OpenRedirectValidatorService();

  it('allows safe internal relative URLs', () => {
    const res = validator.validateRedirectUrl('/challenges/view?id=42');
    assert.equal(res.isSafe, true);
    assert.equal(res.sanitizedUrl, '/challenges/view?id=42');
  });

  it('allows explicitly whitelisted external corporate domains', () => {
    const res = validator.validateRedirectUrl('https://app.codepulse.io/login/callback');
    assert.equal(res.isSafe, true);
  });

  it('blocks protocol-relative URLs and falls back to safe path', () => {
    const res = validator.validateRedirectUrl('//malicious-site.com/steal-token');
    assert.equal(res.isSafe, false);
    assert.equal(res.sanitizedUrl, '/dashboard');
    assert.ok(res.reason.includes('Protocol-relative URL'));
  });

  it('blocks unlisted external domains', () => {
    const res = validator.validateRedirectUrl('https://evil-phishing.com/login');
    assert.equal(res.isSafe, false);
    assert.equal(res.sanitizedUrl, '/dashboard');
  });
});
