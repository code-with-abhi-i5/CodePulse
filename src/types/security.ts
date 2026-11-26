export interface PlagiarismResult {
  similarity: number;
  isPlagiarism: boolean;
}

export interface WebauthnChallenge {
  challenge: string;
  userId: string;
  expiresAt: number;
}

export interface RefreshTokenRecord {
  token: string;
  hash: string;
}

export interface RateLimitStatus {
  allowed: boolean;
  delayMs: number;
  reputation: number;
}

export interface SecretScanResult {
  containsSecrets: boolean;
  detectedSecrets: Array<{ type: string; line: number }>;
}

export interface MerkleAuditEntry {
  index: number;
  timestamp: number;
  adminId: string;
  action: string;
  detailsHash: string;
  prevHash: string;
  entryHash: string;
}


// --- Batch 15 Security Types ---
export interface OAuthStatePayload {
  csrfToken: string;
  sessionId: string;
  redirectUri: string;
  issuedAt: number;
}

export interface PwnedCheckResult {
  isPwned: boolean;
  prefix: string;
  hashCount: number;
}

export interface CspHeaderDirectives {
  nonce: string;
  contentSecurityPolicyHeader: string;
}

export interface HmacVerificationResult {
  isValid: boolean;
  timestampDriftMs: number;
  reason?: string;
}

export interface PiiMaskingResult {
  sanitized: string;
  redactedCount: number;
  typesRedacted: string[];
}

export interface HijackAnomalyResult {
  isCompromised: boolean;
  anomalyScore: number;
  reasons: string[];
  revokeSession: boolean;
}

export interface RbacEvaluationResult {
  allowed: boolean;
  inheritedRoles: string[];
  evaluatedPermissions: string[];
  denialReason?: string;
}

export interface NonceValidationResult {
  accepted: boolean;
  nonce: string;
  reason?: string;
}

export interface CidrEvaluationResult {
  isAllowed: boolean;
  clientIp: string;
  matchedCidr?: string;
  reason?: string;
}

export interface SamlAssertionResult {
  isValid: boolean;
  nameId: string;
  attributes: Record<string, string>;
  issuer: string;
  errors: string[];
}
