/**
 * Architecture Service: Bug Bounty PGP Encryption Gateway
 * Subsystem: Enterprise Authentication & Cryptography [SEC-AUTH-55]
 */

import crypto from 'node:crypto';

export interface BugBountySubmission {
  researcherEmail: string;
  vulnerabilityTitle: string;
  markdownDetails: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class BugBountyPgpGatewayService {
  private recipientPublicKeyPem: string;

  constructor(recipientPublicKeyPem: string) {
    this.recipientPublicKeyPem = recipientPublicKeyPem;
  }

  public encryptSubmission(submission: BugBountySubmission): { encryptedReport: string; submissionId: string; sha256Fingerprint: string } {
    const submissionId = 'vuln_' + crypto.randomBytes(12).toString('hex');
    const rawPayload = JSON.stringify({
      submissionId,
      ...submission,
      submittedAt: new Date().toISOString()
    });

    const sha256Fingerprint = crypto.createHash('sha256').update(rawPayload).digest('hex');

    // Envelope encryption: AES-256-GCM + RSA key encryption
    const aesKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
    const encryptedBody = Buffer.concat([cipher.update(rawPayload, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const encryptedKey = crypto.publicEncrypt(
      {
        key: this.recipientPublicKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      aesKey
    );

    const armoredPayload = [
      '-----BEGIN CODEPULSE ENCRYPTED SECURITY ADVISORY-----',
      'Version: CodePulse Security Gateway v1.0',
      `Submission-ID: ${submissionId}`,
      `Integrity-SHA256: ${sha256Fingerprint}`,
      '',
      `Encrypted-Key: ${encryptedKey.toString('base64')}`,
      `IV: ${iv.toString('hex')}`,
      `Auth-Tag: ${authTag.toString('hex')}`,
      '',
      encryptedBody.toString('base64'),
      '-----END CODEPULSE ENCRYPTED SECURITY ADVISORY-----'
    ].join('\n');

    return {
      encryptedReport: armoredPayload,
      submissionId,
      sha256Fingerprint
    };
  }
}
