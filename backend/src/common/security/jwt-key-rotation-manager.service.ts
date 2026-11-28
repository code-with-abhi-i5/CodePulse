import { KeyRotationState } from '../../types/security';

export class JwtKeyRotationManagerService {
  private activeKeyId: string = 'key-v1';
  private validKeyIds = new Set<string>(['key-v1']);
  private revokedKeyIds = new Set<string>();

  public rotateKey(newKeyId: string): KeyRotationState {
    this.validKeyIds.add(newKeyId);
    this.activeKeyId = newKeyId;
    return this.getState();
  }

  public revokeKey(keyId: string): KeyRotationState {
    this.validKeyIds.delete(keyId);
    this.revokedKeyIds.add(keyId);
    return this.getState();
  }

  public isKeyValid(keyId: string): boolean {
    return this.validKeyIds.has(keyId) && !this.revokedKeyIds.has(keyId);
  }

  public getState(): KeyRotationState {
    return {
      activeKeyId: this.activeKeyId,
      validKeyIds: Array.from(this.validKeyIds),
      revokedKeyIds: Array.from(this.revokedKeyIds)
    };
  }
}
