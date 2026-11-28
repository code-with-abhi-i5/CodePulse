import crypto from 'node:crypto';
import { SriHashResult } from '../../types/security';

export class SriHashCalculatorService {
  constructor(private readonly algorithm: 'sha384' | 'sha512' = 'sha384') {}

  public calculateIntegrity(bundleContent: string | Buffer): SriHashResult {
    const hash = crypto.createHash(this.algorithm).update(bundleContent).digest('base64');
    const integrityString = `${this.algorithm}-${hash}`;
    const htmlScriptTag = `<script src="bundle.js" integrity="${integrityString}" crossorigin="anonymous"></script>`;

    return {
      algorithm: this.algorithm,
      integrityString,
      htmlScriptTag
    };
  }

  public verifyIntegrity(bundleContent: string | Buffer, expectedIntegrityString: string): boolean {
    const [alg, expectedHash] = expectedIntegrityString.split('-');
    if (alg !== 'sha384' && alg !== 'sha512') {
      return false;
    }
    const actualHash = crypto.createHash(alg).update(bundleContent).digest('base64');
    return actualHash === expectedHash;
  }
}
