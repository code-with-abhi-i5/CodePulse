import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PciDssBillingIsolationGatewayService } from './sec-auth-53.service.ts';

describe('PciDssBillingIsolationGatewayService (SEC-AUTH-53)', () => {
  it('tokenizes valid credit cards with Luhn checksum validation and masks PAN', () => {
    const gateway = new PciDssBillingIsolationGatewayService();
    // Valid Visa test card (4242 4242 4242 4242) passing Luhn
    const card = {
      pan: '4242424242424242',
      expMonth: 12,
      expYear: 2028,
      cvv: '123'
    };

    const res = gateway.tokenizeCard('tenant_acme', card);
    assert.strictEqual(res.success, true);
    assert.ok(res.tokenizedCard.token.startsWith('tok_pci_'));
    assert.strictEqual(res.tokenizedCard.maskedPan, '****-****-****-4242');
    assert.strictEqual(res.tokenizedCard.cardBrand, 'Visa');
    assert.strictEqual(gateway.isTokenValidForTenant(res.tokenizedCard.token, 'tenant_acme'), true);
    assert.strictEqual(gateway.isTokenValidForTenant(res.tokenizedCard.token, 'tenant_other'), false);
  });

  it('rejects cards failing Luhn checksum validation', () => {
    const gateway = new PciDssBillingIsolationGatewayService();
    const badCard = {
      pan: '4242424242424241',
      expMonth: 5,
      expYear: 2027,
      cvv: '999'
    };

    const res = gateway.tokenizeCard('tenant_acme', badCard);
    assert.strictEqual(res.success, false);
    assert.match(res.error, /failing Luhn algorithm/i);
  });
});
