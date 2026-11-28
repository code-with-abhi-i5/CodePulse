import { DualCredentialRotation } from '../../types/security';

export class SecretsRotationManagerService {
  private rotationState: DualCredentialRotation = {
    primarySecret: 'initial-db-secret',
    rotationState: 'STABLE',
    lastRotatedAt: Date.now()
  };

  public initiateRotation(newSecret: string, now: number = Date.now()): DualCredentialRotation {
    this.rotationState = {
      primarySecret: newSecret,
      standbySecret: this.rotationState.primarySecret,
      rotationState: 'ROTATING',
      lastRotatedAt: now
    };
    return this.rotationState;
  }

  public finalizeRotation(now: number = Date.now()): DualCredentialRotation {
    this.rotationState = {
      primarySecret: this.rotationState.primarySecret,
      rotationState: 'STABLE',
      lastRotatedAt: now
    };
    return this.rotationState;
  }

  public isValidSecret(secret: string): boolean {
    return secret === this.rotationState.primarySecret || secret === this.rotationState.standbySecret;
  }

  public getState(): DualCredentialRotation {
    return this.rotationState;
  }
}
