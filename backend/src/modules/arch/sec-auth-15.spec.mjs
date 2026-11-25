import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WebSocketHandshakeTicketService } from './sec-auth-15.service.ts';

describe('WebSocketHandshakeTicketService (SEC-AUTH-15)', () => {
  it('issues single-use short-lived tickets and blocks cross-site origins', () => {
    const ticketService = new WebSocketHandshakeTicketService();
    const ticket = ticketService.issueTicket('user-777');

    // Valid redemption with authorized origin
    const valid = ticketService.redeemTicket(ticket, 'https://codepulse.io', ['https://codepulse.io']);
    assert.strictEqual(valid.isValid, true);
    assert.strictEqual(valid.userId, 'user-777');

    // Single-use replay fails
    const replay = ticketService.redeemTicket(ticket, 'https://codepulse.io', ['https://codepulse.io']);
    assert.strictEqual(replay.isValid, false);

    // Malicious foreign origin fails
    const ticket2 = ticketService.issueTicket('user-888');
    const forgedOrigin = ticketService.redeemTicket(ticket2, 'https://evil-site.com', ['https://codepulse.io']);
    assert.strictEqual(forgedOrigin.isValid, false);
    assert.ok(forgedOrigin.error.includes('unauthorized origin'));
  });
});
