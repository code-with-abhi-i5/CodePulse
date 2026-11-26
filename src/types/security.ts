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


// --- Batch 16 Security Types ---
export interface Argon2idTuningParams {
  memoryCostKiB: number;
  timeCostIterations: number;
  parallelismThreads: number;
  hashLength: number;
  estimatedLatencyMs: number;
}

export interface PowChallenge {
  challengeId: string;
  difficultyPrefix: string;
  seed: string;
  expiresAt: number;
}

export interface DualCredentialRotation {
  primarySecret: string;
  standbySecret?: string;
  rotationState: 'STABLE' | 'ROTATING' | 'GRACE_PERIOD';
  lastRotatedAt: number;
}

export interface TenantQueryValidation {
  isSafe: boolean;
  tenantId?: string;
  violation?: string;
}

export interface EncryptedApiPayload {
  ephemeralPublicKey: string;
  iv: string;
  ciphertext: string;
  authTag: string;
}

export interface RateGovernorResult {
  allowed: boolean;
  tokensRemaining: number;
  retryAfterSeconds: number;
  currentBurst: number;
}

export interface CrlVerificationResult {
  isRevoked: boolean;
  serialNumber: string;
  revocationReason?: string;
  crlIssuer: string;
}

export interface KeyRotationState {
  activeKeyId: string;
  validKeyIds: string[];
  revokedKeyIds: string[];
}

export interface WebauthnHardwareFlags {
  userPresent: boolean;
  userVerified: boolean;
  backupEligible: boolean;
  backupState: boolean;
}

export interface PkceVerificationResult {
  valid: boolean;
  error?: string;
}
