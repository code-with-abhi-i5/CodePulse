import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class WebsocketSubprotocolValidatorService {
  constructor(supportedProtocols = ['codepulse.v1.json', 'codepulse.v1.binary']) {
    this.supportedProtocols = supportedProtocols;
  }

  validateHandshake(subprotocolsHeader, authToken) {
    if (!authToken || authToken.trim() === '') {
      return {
        accepted: false,
        rejectionReason: 'Missing WebSocket authentication ticket or cookie'
      };
    }

    if (!subprotocolsHeader) {
      return {
        accepted: false,
        rejectionReason: 'Sec-WebSocket-Protocol header is required'
      };
    }

    const requested = subprotocolsHeader.split(',').map(s => s.trim());
    const selected = requested.find(p => this.supportedProtocols.includes(p));

    if (!selected) {
      return {
        accepted: false,
        rejectionReason: 'No requested subprotocol matching supported set: ' + this.supportedProtocols.join(', ')
      };
    }

    return {
      accepted: true,
      selectedSubprotocol: selected,
      userId: 'user-session'
    };
  }
}

describe('WebsocketSubprotocolValidatorService', () => {
  const validator = new WebsocketSubprotocolValidatorService();

  it('accepts authorized handshakes with matching subprotocol negotiation', () => {
    const res = validator.validateHandshake('graphql-ws, codepulse.v1.json', 'valid-auth-token');
    assert.equal(res.accepted, true);
    assert.equal(res.selectedSubprotocol, 'codepulse.v1.json');
  });

  it('rejects handshakes lacking auth credentials or valid subprotocols', () => {
    const resNoAuth = validator.validateHandshake('codepulse.v1.json', '');
    assert.equal(resNoAuth.accepted, false);
    assert.ok(resNoAuth.rejectionReason.includes('Missing WebSocket'));

    const resBadProto = validator.validateHandshake('unknown.v99', 'valid-token');
    assert.equal(resBadProto.accepted, false);
    assert.ok(resBadProto.rejectionReason.includes('No requested subprotocol'));
  });
});
