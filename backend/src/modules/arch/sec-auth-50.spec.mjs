import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { DockerChallengeImageSignatureVerifierService } from './sec-auth-50.service.ts';

describe('DockerChallengeImageSignatureVerifierService (SEC-AUTH-50)', () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  it('approves challenge images with valid cryptographic RSA signatures from trusted registries', () => {
    const verifierService = new DockerChallengeImageSignatureVerifierService(publicKey);
    const imageName = 'registry.codepulse.io/challenges/node-runner';
    const tag = 'v2.1.0';
    const digest = 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    const signer = crypto.createSign('SHA256');
    signer.update(`${imageName}:${tag}@${digest}`);
    const signature = signer.sign(privateKey, 'hex');

    const res = verifierService.verifyImage({ imageName, tag, digest, signature });
    assert.strictEqual(res.verified, true);
  });

  it('rejects images from untrusted external registries or tampered digests', () => {
    const verifierService = new DockerChallengeImageSignatureVerifierService(publicKey);
    const untrustedRes = verifierService.verifyImage({
      imageName: 'evil-registry.com/malicious-runner',
      tag: 'latest',
      digest: 'sha256:1111',
      signature: 'deadbeef'
    });

    assert.strictEqual(untrustedRes.verified, false);
    assert.match(untrustedRes.error, /not in trusted registry list/i);
  });
});
