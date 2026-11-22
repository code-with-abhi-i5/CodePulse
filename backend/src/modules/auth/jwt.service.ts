import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PostQuantumService } from '../crypto/post-quantum.service';

export interface PqcTokenPayload {
  sub: string;
  username?: string;
  role?: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
}

export interface PqcTokenHeader {
  alg: 'ML-DSA-65' | 'HYBRID_ED25519_ML_DSA_65';
  typ: 'JWT';
}

@Injectable()
export class PostQuantumJwtService {
  constructor(private readonly pqcService: PostQuantumService) {}

  /**
   * Signs a JWT token with NIST ML-DSA-65 (Dilithium-3) or Hybrid Dual-Signature
   */
  public signToken(
    payload: PqcTokenPayload,
    options: {
      pqcSecretKey: string;
      classicalSecretKey?: string;
      expiresInSeconds?: number;
    },
  ): string {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (options.expiresInSeconds || 3600); // 1 hour default

    const fullPayload = {
      ...payload,
      iat: payload.iat || now,
      exp: payload.exp || exp,
    };

    const isHybrid = !!options.classicalSecretKey;
    const header: PqcTokenHeader = {
      alg: isHybrid ? 'HYBRID_ED25519_ML_DSA_65' : 'ML-DSA-65',
      typ: 'JWT',
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    if (isHybrid) {
      const dualSig = this.pqcService.signHybrid(
        signingInput,
        options.classicalSecretKey!,
        options.pqcSecretKey,
      );
      // Compact token format: header.payload.classicalSig.pqcSig
      return `${signingInput}.${Buffer.from(dualSig.classicalSignature, 'base64').toString('base64url')}.${Buffer.from(dualSig.pqcSignature, 'base64').toString('base64url')}`;
    } else {
      const pqcSig = this.pqcService.signDsa(signingInput, options.pqcSecretKey);
      return `${signingInput}.${Buffer.from(pqcSig, 'base64').toString('base64url')}`;
    }
  }

  /**
   * Verifies and decodes a quantum-resistant JWT token
   */
  public verifyToken<T = PqcTokenPayload>(
    token: string,
    options: {
      pqcPublicKey: string;
      classicalPublicKey?: string;
    },
  ): T {
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Token is required');
    }

    const parts = token.split('.');
    if (parts.length !== 3 && parts.length !== 4) {
      throw new UnauthorizedException('Invalid token structure: expected JWS compact representation');
    }

    const [encodedHeader, encodedPayload] = parts;
    let header: PqcTokenHeader;
    let payload: T & PqcTokenPayload;

    try {
      header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8'));
      payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    } catch {
      throw new UnauthorizedException('Malformed token header or payload');
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new UnauthorizedException('Token has expired');
    }

    const signingInput = `${encodedHeader}.${encodedPayload}`;

    if (header.alg === 'HYBRID_ED25519_ML_DSA_65') {
      if (parts.length !== 4) {
        throw new UnauthorizedException('Invalid hybrid token format: expected 4 segments');
      }
      if (!options.classicalPublicKey) {
        throw new BadRequestException('classicalPublicKey is required to verify hybrid token');
      }

      const classicalSig = Buffer.from(parts[2], 'base64url').toString('base64');
      const pqcSig = Buffer.from(parts[3], 'base64url').toString('base64');

      const verification = this.pqcService.verifyHybrid(
        signingInput,
        classicalSig,
        pqcSig,
        options.classicalPublicKey,
        options.pqcPublicKey,
      );

      if (!verification.valid) {
        throw new UnauthorizedException(
          `Hybrid signature verification failed: classical=${verification.classicalValid}, pqc=${verification.pqcValid}`,
        );
      }
    } else if (header.alg === 'ML-DSA-65') {
      if (parts.length !== 3) {
        throw new UnauthorizedException('Invalid ML-DSA token format: expected 3 segments');
      }
      const pqcSig = Buffer.from(parts[2], 'base64url').toString('base64');
      const isValid = this.pqcService.verifyDsa(signingInput, pqcSig, options.pqcPublicKey);

      if (!isValid) {
        throw new UnauthorizedException('ML-DSA-65 quantum-resistant signature verification failed');
      }
    } else {
      throw new UnauthorizedException(`Unsupported token algorithm: ${(header as any).alg}`);
    }

    return payload;
  }
}
