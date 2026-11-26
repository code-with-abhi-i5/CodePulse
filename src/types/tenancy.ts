/**
 * Multi-Tenancy & Governance Architecture Types
 */

export interface TenantContext {
  tenantId: string;
  organizationId: string;
  role: 'admin' | 'member' | 'guest';
  isolationLevel: 'strict' | 'shared';
}

export interface WebhookPayload {
  eventId: string;
  eventType: string;
  timestamp: number;
  data: Record<string, unknown>;
}

export interface WebhookDeliveryResult {
  endpoint: string;
  attempts: number;
  statusCode: number;
  signature: string;
  delivered: boolean;
}

export interface AuditRecord {
  recordId: string;
  tenantId: string;
  actorId: string;
  action: string;
  resource: string;
  timestamp: number;
  ipAddress: string;
}

export interface SlaEvaluation {
  tenantId: string;
  month: string;
  uptimePercentage: number;
  slaMet: boolean;
  downtimeMinutes: number;
  penaltyCreditPercent: number;
}

export interface SamlUserAssertion {
  issuer: string;
  nameId: string;
  email: string;
  firstName: string;
  lastName: string;
  groups: string[];
  sessionIndex: string;
}

export interface ProvisionedUser {
  userId: string;
  email: string;
  name: string;
  tenantId: string;
  role: string;
  isNew: boolean;
}

export interface DomainCertificateStatus {
  domain: string;
  tenantId: string;
  cnameVerified: boolean;
  tlsCertificateIssued: boolean;
  expiresAt?: string;
  status: 'pending_cname' | 'active' | 'failed';
}

export interface CidrRule {
  cidr: string;
  description?: string;
}

export interface RetentionPurgeReport {
  tenantId: string;
  recordsEvaluated: number;
  recordsPurged: number;
  storageReclaimedMb: number;
  status: 'completed' | 'in_progress';
}

export interface MeteringRecord {
  tenantId: string;
  computeSeconds: number;
  memoryMbSeconds: number;
  storageGigabytes: number;
  calculatedCostUsd: number;
}
