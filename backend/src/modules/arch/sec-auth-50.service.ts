/**
 * Architecture Service: Docker Challenge Image Signature Verifier
 * Subsystem: Enterprise Authentication & Cryptography [SEC-AUTH-50]
 */

import crypto from 'node:crypto';

export interface ImageManifest {
  imageName: string;
  tag: string;
  digest: string; // sha256:...
  signature: string; // hex
}

export class DockerChallengeImageSignatureVerifierService {
  private publicKeyPem: string;
  private trustedRegistries: string[];

  constructor(
    publicKeyPem: string,
    trustedRegistries: string[] = ['registry.codepulse.io', 'ghcr.io/code-with-abhi-i5']
  ) {
    this.publicKeyPem = publicKeyPem;
    this.trustedRegistries = trustedRegistries;
  }

  public verifyImage(manifest: ImageManifest): { verified: boolean; error?: string } {
    // 1. Registry verification
    const isTrustedRegistry = this.trustedRegistries.some(reg => manifest.imageName.startsWith(reg));
    if (!isTrustedRegistry) {
      return { verified: false, error: `Image repository '${manifest.imageName}' is not in trusted registry list` };
    }

    // 2. Cryptographic signature check
    try {
      const verifier = crypto.createVerify('SHA256');
      verifier.update(`${manifest.imageName}:${manifest.tag}@${manifest.digest}`);
      const isValid = verifier.verify(this.publicKeyPem, Buffer.from(manifest.signature, 'hex'));
      if (!isValid) {
        return { verified: false, error: 'Cryptographic signature verification failed' };
      }
      return { verified: true };
    } catch (err: any) {
      return { verified: false, error: `Signature verification exception: ${err.message}` };
    }
  }
}
