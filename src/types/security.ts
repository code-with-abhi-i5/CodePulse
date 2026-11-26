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
