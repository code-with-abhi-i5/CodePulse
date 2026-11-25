import { WebauthnPasskeyService } from './webauthn-passkey.service';

describe('WebauthnPasskeyService', () => {
  let service: WebauthnPasskeyService;

  beforeEach(() => {
    service = new WebauthnPasskeyService();
  });

  it('generates cryptographic challenge and verifies valid passkey auth response', () => {
    const ch = service.generateChallenge('user-1');
    expect(ch.challenge).toBeDefined();
    expect(service.verifyPasskeyResponse('user-1', ch.challenge, 'valid-sig')).toBe(true);
  });
});
