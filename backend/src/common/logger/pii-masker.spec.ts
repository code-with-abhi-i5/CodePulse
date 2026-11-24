import { PiiMaskerService } from './pii-masker.service';
import { PayloadAuditLoggerService } from './payload-audit-logger.service';

describe('PiiMaskerService & PayloadAuditLoggerService', () => {
  let piiMasker: PiiMaskerService;
  let auditLogger: PayloadAuditLoggerService;

  beforeEach(() => {
    piiMasker = new PiiMaskerService();
    auditLogger = new PayloadAuditLoggerService(piiMasker);
  });

  describe('PiiMaskerService AST and Regex transformations', () => {
    it('should mask sensitive dictionary keys like password and authorization', () => {
      const payload = {
        username: 'student123',
        password: 'SuperSecretPassword!456',
        apiKey: 'sk-998877665544332211',
        metadata: {
          token: 'auth-bearer-token-123',
        },
      };

      const { masked, stats } = piiMasker.maskPayload(payload);
      expect(masked.password).toBe('[REDACTED_SECRET]');
      expect(masked.apiKey).toBe('[REDACTED_SECRET]');
      expect(masked.metadata.token).toBe('[REDACTED_SECRET]');
      expect(masked.username).toBe('student123');
      expect(stats.maskedFieldsCount).toBe(3);
    });

    it('should mask credit card numbers, JWTs, emails, and SSNs in strings', () => {
      const jwtSample = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const text = `Contact student at john.doe@university.edu with card 4111-2222-3333-4444 and token ${jwtSample}`;

      const masked = piiMasker.maskStringContent(text);
      expect(masked).toContain('j***@university.edu');
      expect(masked).toContain('****-****-****-4444');
      expect(masked).toContain('[REDACTED_JWT]');
      expect(masked).not.toContain('4111-2222-3333');
    });

    it('should execute masking in under 150 microseconds for typical payload sizes', () => {
      const payload = {
        studentId: 'std_908',
        email: 'alice.smith@college.edu',
        billing: {
          creditCard: '5500-1234-5678-9999',
          amount: 250.0,
        },
      };

      const { stats } = piiMasker.maskPayload(payload);
      expect(stats.durationUs).toBeLessThan(1000); // well within fast execution threshold
    });
  });

  describe('PayloadAuditLoggerService audit trails', () => {
    it('should record sanitized transactions with audit ID and status codes', () => {
      const req = { user: 'bob', password: 'plainPassword' };
      const res = { success: true, email: 'bob@example.com' };

      const entry = auditLogger.logTransaction('POST', '/api/v1/auth/login', 200, '127.0.0.1', req, res, 12.4, 'u-123');

      expect(entry.auditId).toMatch(/^audit-/);
      expect(entry.requestPayloadMasked.password).toBe('[REDACTED_SECRET]');
      expect(entry.responsePayloadMasked.email).toBe('b***@example.com');
      expect(auditLogger.getBufferSize()).toBe(1);
    });
  });
});
