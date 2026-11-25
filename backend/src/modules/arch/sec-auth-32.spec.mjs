import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AuditLogMerkleNotaryService } from './sec-auth-32.service.ts';

describe('AuditLogMerkleNotaryService (SEC-AUTH-32)', () => {
  it('computes deterministic Merkle root hashes for audit log entry batches', () => {
    const notary = new AuditLogMerkleNotaryService();
    const logs = ['LOGIN user-1', 'DEPLOY release-2.0', 'ROLE_CHANGE admin'];

    const proof = notary.createNotaryProof('2026-11-25', logs);
    assert.strictEqual(proof.entryCount, 3);
    assert.strictEqual(proof.merkleRoot.length, 64);

    // Deterministic verify
    const root2 = notary.computeMerkleRoot(logs);
    assert.strictEqual(proof.merkleRoot, root2);
  });
});
