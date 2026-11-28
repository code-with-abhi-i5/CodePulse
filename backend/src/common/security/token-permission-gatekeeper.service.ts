import { ScopedAccessResult } from '../../types/security';

export class TokenPermissionGatekeeperService {
  public evaluateAccess(userId: string, heldScopes: string[], requiredScope: string): ScopedAccessResult {
    // Admin wildcard grants everything
    if (heldScopes.includes('*') || heldScopes.includes('admin:*') || heldScopes.includes('admin')) {
      return { granted: true, userId, requiredScope, heldScopes };
    }

    // Exact match
    if (heldScopes.includes(requiredScope)) {
      return { granted: true, userId, requiredScope, heldScopes };
    }

    // Domain wildcard check: e.g. "challenges:*" covers "challenges:read"
    const [reqDomain] = requiredScope.split(':');
    if (heldScopes.includes(`${reqDomain}:*`)) {
      return { granted: true, userId, requiredScope, heldScopes };
    }

    return {
      granted: false,
      userId,
      requiredScope,
      heldScopes,
      reason: `User does not hold required scope "${requiredScope}"`
    };
  }
}
