import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SubresourceIntegrityInjectorService } from './sec-auth-19.service.ts';

describe('SubresourceIntegrityInjectorService (SEC-AUTH-19)', () => {
  it('computes SHA-384 hashes and injects SRI integrity and crossorigin attributes', () => {
    const injector = new SubresourceIntegrityInjectorService();
    const jsPayload = 'console.log("secure third party lib");';

    const hash = injector.generateSriHash(jsPayload, 'sha384');
    assert.ok(hash.startsWith('sha384-'));

    const rawTag = '<script src="https://cdn.example.com/lib.js">';
    const securedTag = injector.injectSriIntoTag(rawTag, jsPayload);

    assert.ok(securedTag.includes(`integrity="${hash}"`));
    assert.ok(securedTag.includes('crossorigin="anonymous"'));
  });
});
