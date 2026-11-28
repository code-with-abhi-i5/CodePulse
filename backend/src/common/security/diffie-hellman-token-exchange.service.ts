import crypto from 'node:crypto';
import { DhKeyExchangeResult } from '../../types/security';

export class DiffieHellmanTokenExchangeService {
  constructor(private readonly tokenTtlMs: number = 300000) {}

  public generateServerKeyPair(): { ecdh: crypto.ECDH; publicKeyHex: string } {
    const ecdh = crypto.createECDH('prime256v1');
    ecdh.generateKeys();
    return {
      ecdh,
      publicKeyHex: ecdh.getPublicKey('hex')
    };
  }

  public computeSharedSecret(serverEcdh: crypto.ECDH, clientPublicKeyHex: string, sessionId: string, now: number = Date.now()): DhKeyExchangeResult {
    const clientPubKeyBuffer = Buffer.from(clientPublicKeyHex, 'hex');
    const secret = serverEcdh.computeSecret(clientPubKeyBuffer);
    const sharedSecretHash = crypto.createHash('sha256').update(secret).digest('hex');

    return {
      sessionId,
      publicKeyHex: serverEcdh.getPublicKey('hex'),
      sharedSecretHash,
      expiresAt: now + this.tokenTtlMs
    };
  }

  public isTokenExpired(result: DhKeyExchangeResult, now: number = Date.now()): boolean {
    return now >= result.expiresAt;
  }
}
