/**
 * Architecture Service: Refresh Token Rotation with Family Reuse Detection
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-17]
 */

export interface TokenFamilyRecord {
  familyId: string;
  currentToken: string;
  usedTokens: Set<string>;
  isRevoked: boolean;
}

export class RefreshTokenRotationService {
  private families: Map<string, TokenFamilyRecord>;

  constructor() {
    this.families = new Map();
  }

  public registerFamily(familyId: string, initialToken: string): void {
    this.families.set(familyId, {
      familyId,
      currentToken: initialToken,
      usedTokens: new Set(),
      isRevoked: false
    });
  }

  public rotateToken(familyId: string, presentedToken: string, newToken: string): {
    success: boolean;
    newToken?: string;
    isCompromised: boolean;
    error?: string;
  } {
    const family = this.families.get(familyId);
    if (!family || family.isRevoked) {
      return { success: false, isCompromised: false, error: 'Token family revoked or not found' };
    }

    // Reuse detection: If token was previously used, whole family is compromised!
    if (family.usedTokens.has(presentedToken)) {
      family.isRevoked = true;
      return {
        success: false,
        isCompromised: true,
        error: 'Security Breach: Refresh token reuse detected! Entire token family revoked immediately.'
      };
    }

    if (family.currentToken !== presentedToken) {
      return { success: false, isCompromised: false, error: 'Invalid refresh token presented' };
    }

    // Normal rotation
    family.usedTokens.add(presentedToken);
    family.currentToken = newToken;

    return { success: true, newToken, isCompromised: false };
  }
}
