import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

class SriHashCalculatorService {
  constructor(algorithm = 'sha384') {
    this.algorithm = algorithm;
  }

  calculateIntegrity(bundleContent) {
    const hash = crypto.createHash(this.algorithm).update(bundleContent).digest('base64');
    const integrityString = this.algorithm + '-' + hash;
    const htmlScriptTag = '<script src="bundle.js" integrity="' + integrityString + '" crossorigin="anonymous"></script>';

    return {
      algorithm: this.algorithm,
      integrityString,
      htmlScriptTag
    };
  }

  verifyIntegrity(bundleContent, expectedIntegrityString) {
    const [alg, expectedHash] = expectedIntegrityString.split('-');
    if (alg !== 'sha384' && alg !== 'sha512') {
      return false;
    }
    const actualHash = crypto.createHash(alg).update(bundleContent).digest('base64');
    return actualHash === expectedHash;
  }
}

describe('SriHashCalculatorService', () => {
  const sri = new SriHashCalculatorService('sha384');

  it('generates deterministic SHA-384 Subresource Integrity hashes and script tags', () => {
    const content = 'console.log("hello world");';
    const result = sri.calculateIntegrity(content);

    assert.ok(result.integrityString.startsWith('sha384-'));
    assert.ok(result.htmlScriptTag.includes('crossorigin="anonymous"'));
    assert.equal(sri.verifyIntegrity(content, result.integrityString), true);
  });

  it('detects tampering or corruption in CDN bundle verification', () => {
    const original = 'function main() { return 1; }';
    const tampered = 'function main() { return 2; }';
    const result = sri.calculateIntegrity(original);

    assert.equal(sri.verifyIntegrity(tampered, result.integrityString), false);
  });
});
