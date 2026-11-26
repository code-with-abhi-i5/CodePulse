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


// --- Batch 14 Security Types ---
export interface TlsScanReport {
  domain: string;
  daysRemaining: number;
  needsRenewal: boolean;
  issuedAcmeChallenge?: 'HTTP-01' | 'DNS-01';
  expiryDateIso: string;
}

export interface SqliScanResult {
  hasInjection: boolean;
  detectedPatterns: string[];
  sanitizedSql?: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'LOW' | 'NONE';
}

export interface CookieValidationResult {
  isValid: boolean;
  cookieName: string;
  payload?: string;
  tamperDetected: boolean;
}

export interface PasskeyVerificationResult {
  verified: boolean;
  userId: string;
  credentialId: string;
  counter: number;
  error?: string;
}

export interface EnvoyMeshPolicy {
  policyName: string;
  spiffeId: string;
  allowedMethods: string[];
  pathPrefixes: string[];
  action: 'ALLOW' | 'DENY';
}

export interface SriHashResult {
  algorithm: 'sha384' | 'sha512';
  integrityString: string;
  htmlScriptTag: string;
}

export interface XssSanitizationResult {
  isClean: boolean;
  detectedThreats: string[];
  sanitizedCode: string;
}

export interface RsaKeypairResult {
  keyId: string;
  publicKeyPem: string;
  privateKeyPem: string;
  bitLength: number;
  jwk: { kty: string; use: string; alg: string; kid: string; n?: string; e?: string };
}

export interface WsHandshakeResult {
  accepted: boolean;
  selectedSubprotocol?: string;
  userId?: string;
  rejectionReason?: string;
}

export interface LockoutStatus {
  isLocked: boolean;
  currentStrikes: number;
  lockoutRemainingMs: number;
  action: 'LOCKOUT' | 'WARN' | 'ALLOW';
}
