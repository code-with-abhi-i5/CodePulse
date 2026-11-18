import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

export interface VerifiableCredentialSubject {
  id: string; // e.g., did:web:codepulse.dev:users:<userId>
  userId: string;
  username: string;
  badgeId: string;
  badgeName: string;
  badgeTier: string;
  category?: string | null;
  earnedAt: string;
  issuerVerificationUrl: string;
  [key: string]: unknown;
}

export interface VerifiableCredential {
  '@context': string[];
  id: string; // urn:uuid:...
  type: string[];
  issuer: {
    id: string; // did:web:codepulse.dev
    name: string;
  };
  issuanceDate: string;
  credentialSubject: VerifiableCredentialSubject;
  proof: {
    type: 'JsonWebSignature2020';
    created: string;
    proofPurpose: 'assertionMethod';
    verificationMethod: string; // did:web:codepulse.dev#key-1
    jws: string; // Detached or standard JWS
  };
}

export interface DidDocument {
  '@context': string[];
  id: string;
  verificationMethod: Array<{
    id: string;
    type: string;
    controller: string;
    publicKeyJwk: {
      kty: string;
      crv: string;
      x: string;
      y: string;
    };
  }>;
  authentication: string[];
  assertionMethod: string[];
}

export interface VerificationResult {
  valid: boolean;
  issuer: string;
  issuanceDate?: string;
  credentialSubject?: VerifiableCredentialSubject;
  error?: string;
}

@Injectable()
export class VerifiableCredentialsService {
  private readonly logger = new Logger(VerifiableCredentialsService.name);

  public readonly issuerDid = 'did:web:codepulse.dev';
  public readonly keyId = `${this.issuerDid}#key-1`;

  private privateKeyPem: string;
  private publicKeyPem: string;
  private publicKeyJwk: { kty: string; crv: string; x: string; y: string };

  constructor(private readonly prisma: PrismaService) {
    this.initializeKeys();
  }

  private initializeKeys() {
    // If env keys provided, use them; otherwise generate deterministic or ephemeral ECDSA P-256 pair
    if (process.env.VC_PRIVATE_KEY_PEM && process.env.VC_PUBLIC_KEY_PEM) {
      this.privateKeyPem = process.env.VC_PRIVATE_KEY_PEM;
      this.publicKeyPem = process.env.VC_PUBLIC_KEY_PEM;
    } else {
      // Deterministic key generation from seed or generate clean P-256
      const seed = process.env.VC_KEY_SEED || 'codepulse-did-web-default-key-seed-32b-secure';
      // Generate keypair
      const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
        namedCurve: 'P-256',
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      this.privateKeyPem = privateKey;
      this.publicKeyPem = publicKey;
    }

    const jwk = crypto
      .createPublicKey(this.publicKeyPem)
      .export({ format: 'jwk' }) as { kty: string; crv: string; x: string; y: string };

    this.publicKeyJwk = {
      kty: jwk.kty,
      crv: jwk.crv,
      x: jwk.x,
      y: jwk.y,
    };
  }

  /**
   * Return the W3C DID document served at did:web:codepulse.dev (/.well-known/did.json)
   */
  getDidDocument(): DidDocument {
    return {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/jws-2020/v1',
      ],
      id: this.issuerDid,
      verificationMethod: [
        {
          id: this.keyId,
          type: 'JsonWebKey2020',
          controller: this.issuerDid,
          publicKeyJwk: this.publicKeyJwk,
        },
      ],
      authentication: [this.keyId],
      assertionMethod: [this.keyId],
    };
  }

  /**
   * Issue a W3C Verifiable Credential 2.0 for a user's earned badge.
   */
  async issueBadgeCredential(userId: string, badgeId: string): Promise<{
    credential: VerifiableCredential;
    rawJwt: string;
  }> {
    const userBadge = await this.prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId } },
      include: { badge: true, user: true },
    });

    if (!userBadge) {
      throw new NotFoundException(`Badge ${badgeId} not earned by user ${userId}`);
    }

    const issuanceDate = new Date().toISOString();
    const credentialId = `urn:uuid:${crypto.randomUUID()}`;
    const userDid = `did:web:codepulse.dev:users:${userBadge.user.username || userId}`;

    const credentialSubject: VerifiableCredentialSubject = {
      id: userDid,
      userId: userBadge.userId,
      username: userBadge.user.username,
      badgeId: userBadge.badgeId,
      badgeName: userBadge.badge.name,
      badgeTier: userBadge.badge.tier,
      category: userBadge.badge.category,
      earnedAt: userBadge.earnedAt.toISOString(),
      issuerVerificationUrl: `https://codepulse.dev/api/v1/identity/verify-credential?vc=${credentialId}`,
    };

    const vcPayloadWithoutProof = {
      '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://w3id.org/security/suites/jws-2020/v1',
      ],
      id: credentialId,
      type: ['VerifiableCredential', 'CodePulseBadgeCredential'],
      issuer: {
        id: this.issuerDid,
        name: 'CodePulse Platform',
      },
      issuanceDate,
      credentialSubject,
    };

    // Sign payload using ECDSA SHA-256
    const payloadBytes = Buffer.from(JSON.stringify(vcPayloadWithoutProof), 'utf8');
    const signer = crypto.createSign('SHA256');
    signer.update(payloadBytes);
    signer.end();
    const signature = signer.sign(this.privateKeyPem, 'base64url');

    const credential: VerifiableCredential = {
      ...vcPayloadWithoutProof,
      proof: {
        type: 'JsonWebSignature2020',
        created: issuanceDate,
        proofPurpose: 'assertionMethod',
        verificationMethod: this.keyId,
        jws: signature,
      },
    };

    // Construct JWT compact representation
    const jwtHeader = Buffer.from(
      JSON.stringify({ alg: 'ES256', typ: 'JWT', kid: this.keyId }),
    ).toString('base64url');
    const jwtPayload = Buffer.from(
      JSON.stringify({
        iss: this.issuerDid,
        sub: userDid,
        nbf: Math.floor(Date.now() / 1000),
        vc: credential,
      }),
    ).toString('base64url');

    const jwtSigner = crypto.createSign('SHA256');
    jwtSigner.update(`${jwtHeader}.${jwtPayload}`);
    jwtSigner.end();
    const jwtSignature = jwtSigner.sign(this.privateKeyPem, 'base64url');
    const rawJwt = `${jwtHeader}.${jwtPayload}.${jwtSignature}`;

    // Persist issued credential to user_badges
    try {
      await this.prisma.userBadge.update({
        where: { userId_badgeId: { userId, badgeId } },
        data: {
          credentialJwt: rawJwt,
          credentialJwk: this.publicKeyJwk as any,
          issuedAt: new Date(issuanceDate),
        },
      });
    } catch (err: any) {
      this.logger.warn(`Could not persist VC to database: ${err.message}`);
    }

    return { credential, rawJwt };
  }

  /**
   * Verify an arbitrary Verifiable Credential (either JSON-LD object or compact JWT string).
   */
  async verifyCredential(vcInput: string | VerifiableCredential): Promise<VerificationResult> {
    try {
      if (!vcInput) {
        throw new BadRequestException('Credential payload is required');
      }

      let credential: VerifiableCredential;

      // Handle compact JWT format
      if (typeof vcInput === 'string' && vcInput.split('.').length === 3) {
        const [headerB64, payloadB64, sigB64] = vcInput.split('.');
        const verifier = crypto.createVerify('SHA256');
        verifier.update(`${headerB64}.${payloadB64}`);
        verifier.end();

        const isValidJwtSig = verifier.verify(this.publicKeyPem, sigB64, 'base64url');
        if (!isValidJwtSig) {
          return {
            valid: false,
            issuer: this.issuerDid,
            error: 'Invalid JWT signature. Tampering detected.',
          };
        }

        const decodedPayload = JSON.parse(
          Buffer.from(payloadB64, 'base64url').toString('utf8'),
        );
        credential = decodedPayload.vc || decodedPayload;
      } else if (typeof vcInput === 'string') {
        credential = JSON.parse(vcInput);
      } else {
        credential = vcInput;
      }

      if (!credential || !credential.proof || !credential.proof.jws) {
        return {
          valid: false,
          issuer: credential?.issuer?.id || 'unknown',
          error: 'Missing cryptographic proof in credential',
        };
      }

      // Extract proof and reconstruct canonical payload for verification
      const { proof, ...payloadToVerify } = credential;

      const verifier = crypto.createVerify('SHA256');
      verifier.update(Buffer.from(JSON.stringify(payloadToVerify), 'utf8'));
      verifier.end();

      const isSignatureValid = verifier.verify(
        this.publicKeyPem,
        proof.jws,
        'base64url',
      );

      if (!isSignatureValid) {
        return {
          valid: false,
          issuer: credential.issuer?.id,
          issuanceDate: credential.issuanceDate,
          credentialSubject: credential.credentialSubject,
          error: 'Cryptographic signature mismatch. Credential has been modified or forged.',
        };
      }

      return {
        valid: true,
        issuer: credential.issuer?.id,
        issuanceDate: credential.issuanceDate,
        credentialSubject: credential.credentialSubject,
      };
    } catch (error: any) {
      return {
        valid: false,
        issuer: this.issuerDid,
        error: `Verification error: ${error.message}`,
      };
    }
  }

  getPublicKeyJwk() {
    return this.publicKeyJwk;
  }
}

