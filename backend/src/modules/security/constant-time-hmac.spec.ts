import { ConstantTimeHmacService } from './constant-time-hmac.service';

describe('ConstantTimeHmacService', () => {
  let service: ConstantTimeHmacService;

  beforeEach(() => {
    service = new ConstantTimeHmacService();
  });

  it('validates authentic signatures and rejects forged signatures safely', () => {
    const secret = 'webhook-super-secret';
    const payload = JSON.stringify({ matchId: 42, event: 'started' });
    const sig = service.signPayload(secret, payload);
    expect(service.verifySignature(secret, payload, sig)).toBe(true);
    expect(service.verifySignature(secret, payload, '0000000000000000000000000000000000000000000000000000000000000000')).toBe(false);
  });
});
