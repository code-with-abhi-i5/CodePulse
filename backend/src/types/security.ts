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


// --- Batch 13 Security Types ---
export interface DhKeyExchangeResult {
  sessionId: string;
  publicKeyHex: string;
  sharedSecretHash: string;
  expiresAt: number;
}

export interface CorsEvaluationResult {
  isAllowed: boolean;
  origin: string;
  allowCredentials: boolean;
  allowHeaders: string[];
  rejectionReason?: string;
}

export interface CertValidationResult {
  isValid: boolean;
  subject: string;
  issuer: string;
  chainLength: number;
  errors: string[];
}

export interface ScopedAccessResult {
  granted: boolean;
  userId: string;
  requiredScope: string;
  heldScopes: string[];
  reason?: string;
}

export interface AuditLedgerBlock {
  index: number;
  timestamp: number;
  action: string;
  actor: string;
  payload: Record<string, unknown>;
  previousHash: string;
  hash: string;
}

export interface ImdsProbeCheckResult {
  isSafe: boolean;
  targetUrl: string;
  detectedThreat?: 'IMDS_ACCESS' | 'LOCALHOST_PROBE' | 'LINK_LOCAL_PROBE' | 'INVALID_URL';
  reason?: string;
}

export interface PodSecurityAuditResult {
  isCompliant: boolean;
  violations: string[];
  score: number;
}

export interface TotpValidationResult {
  isValid: boolean;
  driftSteps: number;
  stepOffsetSeconds: number;
}

export interface SocketGovernorStatus {
  socketId: string;
  shouldTerminate: boolean;
  bytesReceived: number;
  durationMs: number;
  transferRateBytesPerSec: number;
  reason?: string;
}

export interface RedirectValidationResult {
  isSafe: boolean;
  sanitizedUrl: string;
  reason?: string;
}
