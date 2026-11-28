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
