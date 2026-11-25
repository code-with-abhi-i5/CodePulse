import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { ZkpSkillCertificationVerifierService } from './sec-auth-51.service.ts';

describe('ZkpSkillCertificationVerifierService (SEC-AUTH-51)', () => {
  it('verifies non-interactive zero-knowledge proofs and prevents nonce replay attacks', () => {
    const verifier = new ZkpSkillCertificationVerifierService();
    const commitment = 'aabbcc112233';
    const publicSkillKey = '445566778899';
    const nonce = 'unique_nonce_' + Date.now();

    const challenge = crypto.createHash('sha256')
      .update(`${commitment}:${publicSkillKey}:${nonce}`)
      .digest('hex');

    const validProof = {
      commitment,
      publicSkillKey,
      nonce,
      challenge,
      response: '998877665544'
    };

    const res1 = verifier.verifyProof(validProof);
    assert.strictEqual(res1.valid, true);

    // Replay attack with same nonce
    const res2 = verifier.verifyProof(validProof);
    assert.strictEqual(res2.valid, false);
    assert.match(res2.error, /Replay detected/i);
  });
});
