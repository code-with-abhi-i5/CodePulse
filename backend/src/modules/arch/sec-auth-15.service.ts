/**
 * Architecture Service: Secure WebSocket Handshake Ticket Authenticator
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-15]
 */

import crypto from 'node:crypto';

export class WebSocketHandshakeTicketService {
  private activeTickets: Map<string, { userId: string; expiresAt: number }>;
  private hmacSecret: string;
  private ticketTtlMs: number;

  constructor(hmacSecret: string = 'ws-ticket-secret-key-32-chars!', ticketTtlMs: number = 15000) { // 15s short TTL
    this.activeTickets = new Map();
    this.hmacSecret = hmacSecret;
    this.ticketTtlMs = ticketTtlMs;
  }

  public issueTicket(userId: string): string {
    const nonce = crypto.randomBytes(16).toString('hex');
    const expiresAt = Date.now() + this.ticketTtlMs;

    const signature = crypto
      .createHmac('sha256', this.hmacSecret)
      .update(`${userId}:${nonce}:${expiresAt}`)
      .digest('hex');

    const ticket = `${userId}.${nonce}.${expiresAt}.${signature}`;
    this.activeTickets.set(ticket, { userId, expiresAt });
    return ticket;
  }

  public redeemTicket(ticket: string, origin: string, allowedOrigins: string[]): { isValid: boolean; userId?: string; error?: string } {
    if (!allowedOrigins.includes(origin)) {
      return { isValid: false, error: 'Cross-Site WebSocket Hijacking blocked: unauthorized origin' };
    }

    const session = this.activeTickets.get(ticket);
    if (!session) {
      return { isValid: false, error: 'Ticket invalid or already redeemed' };
    }

    // Single-use: delete immediately
    this.activeTickets.delete(ticket);

    if (Date.now() > session.expiresAt) {
      return { isValid: false, error: 'WebSocket handshake ticket expired' };
    }

    return { isValid: true, userId: session.userId };
  }
}
