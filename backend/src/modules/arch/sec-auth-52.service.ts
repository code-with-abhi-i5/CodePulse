/**
 * Architecture Service: MFA Registration Rate-Limiter & Phone Spoofing Guard
 * Subsystem: Enterprise Authentication & Cryptography [SEC-AUTH-52]
 */

export class MfaRegistrationRateLimiterService {
  private userRateLimits: Map<string, number[]>;
  private phoneRateLimits: Map<string, number[]>;
  private maxAttemptsPerHour: number;
  private virtualPrefixes: string[] = ['+1555', '+1800', '+1900'];

  constructor(maxAttemptsPerHour: number = 3) {
    this.maxAttemptsPerHour = maxAttemptsPerHour;
    this.userRateLimits = new Map();
    this.phoneRateLimits = new Map();
  }

  public validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
    const trimmed = phone.trim();
    // E.164 validation regex (+ followed by 10 to 15 digits)
    const e164Regex = /^\+[1-9]\d{9,14}$/;
    if (!e164Regex.test(trimmed)) {
      return { valid: false, error: 'Phone number must be in standard E.164 format (+1234567890)' };
    }

    if (this.virtualPrefixes.some(p => trimmed.startsWith(p))) {
      return { valid: false, error: 'Virtual VoIP or toll-free numbers are prohibited for MFA enrollment' };
    }

    return { valid: true };
  }

  public registerAttempt(userId: string, phone: string): { allowed: boolean; error?: string } {
    const phoneValidation = this.validatePhoneNumber(phone);
    if (!phoneValidation.valid) {
      return { allowed: false, error: phoneValidation.error };
    }

    const now = Date.now();
    const oneHour = 3600000;

    // Check user rate limits
    const userAttempts = (this.userRateLimits.get(userId) || []).filter(ts => now - ts < oneHour);
    if (userAttempts.length >= this.maxAttemptsPerHour) {
      return { allowed: false, error: 'Too many MFA registration requests for this account' };
    }

    // Check phone rate limits
    const phoneAttempts = (this.phoneRateLimits.get(phone) || []).filter(ts => now - ts < oneHour);
    if (phoneAttempts.length >= this.maxAttemptsPerHour) {
      return { allowed: false, error: 'Too many MFA registration requests for this phone number' };
    }

    userAttempts.push(now);
    phoneAttempts.push(now);
    this.userRateLimits.set(userId, userAttempts);
    this.phoneRateLimits.set(phone, phoneAttempts);

    return { allowed: true };
  }
}
