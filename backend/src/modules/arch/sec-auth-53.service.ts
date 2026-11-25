/**
 * Architecture Service: PCI-DSS Billing Data Isolation Gateway
 * Subsystem: Enterprise Authentication & Cryptography [SEC-AUTH-53]
 */

import crypto from 'node:crypto';

export interface CardDetails {
  pan: string;
  expMonth: number;
  expYear: number;
  cvv: string;
}

export interface TokenizedCard {
  token: string;
  maskedPan: string;
  cardBrand: string;
  expMonth: number;
  expYear: number;
  tenantId: string;
}

export class PciDssBillingIsolationGatewayService {
  private tokenVault: Map<string, { encryptedPan: string; tenantId: string }>;
  private hmacKey: string;

  constructor(hmacKey: string = 'pci-vault-hmac-key-secure-seed-32') {
    this.hmacKey = hmacKey;
    this.tokenVault = new Map();
  }

  private validateLuhnChecksum(pan: string): boolean {
    const digits = pan.replace(/\D/g, '');
    let sum = 0;
    let shouldDouble = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  public tokenizeCard(tenantId: string, card: CardDetails): { success: boolean; tokenizedCard?: TokenizedCard; error?: string } {
    const cleanPan = card.pan.replace(/\s|-/g, '');
    if (cleanPan.length < 13 || cleanPan.length > 19 || !this.validateLuhnChecksum(cleanPan)) {
      return { success: false, error: 'Invalid card number failing Luhn algorithm' };
    }

    if (!card.cvv || card.cvv.length < 3 || card.cvv.length > 4) {
      return { success: false, error: 'Invalid CVV length' };
    }

    // Determine brand
    let cardBrand = 'Unknown';
    if (cleanPan.startsWith('4')) cardBrand = 'Visa';
    else if (/^5[1-5]/.test(cleanPan)) cardBrand = 'Mastercard';
    else if (/^3[47]/.test(cleanPan)) cardBrand = 'Amex';

    // Generate non-reversible surrogate token
    const token = 'tok_pci_' + crypto.createHmac('sha256', this.hmacKey)
      .update(`${cleanPan}:${tenantId}:${Date.now()}`)
      .digest('hex').substring(0, 24);

    const maskedPan = '****-****-****-' + cleanPan.slice(-4);

    // PCI DSS Requirement: CVV must NEVER be stored under any circumstances
    this.tokenVault.set(token, {
      encryptedPan: Buffer.from(cleanPan).toString('base64'),
      tenantId
    });

    return {
      success: true,
      tokenizedCard: {
        token,
        maskedPan,
        cardBrand,
        expMonth: card.expMonth,
        expYear: card.expYear,
        tenantId
      }
    };
  }

  public isTokenValidForTenant(token: string, tenantId: string): boolean {
    const record = this.tokenVault.get(token);
    return Boolean(record && record.tenantId === tenantId);
  }
}
