import crypto from 'node:crypto';
import { RsaKeypairResult } from '../../types/security';

export class RsaKeypairProvisionerService {
  public generateKeypair(keyId: string, modulusLength: number = 2048): RsaKeypairResult {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    return {
      keyId,
      publicKeyPem: publicKey,
      privateKeyPem: privateKey,
      bitLength: modulusLength,
      jwk: {
        kty: 'RSA',
        use: 'sig',
        alg: 'RS256',
        kid: keyId
      }
    };
  }
}
