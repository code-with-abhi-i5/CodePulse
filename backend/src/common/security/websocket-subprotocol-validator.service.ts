import { WsHandshakeResult } from '../../types/security';

export class WebsocketSubprotocolValidatorService {
  constructor(private readonly supportedProtocols: string[] = ['codepulse.v1.json', 'codepulse.v1.binary']) {}

  public validateHandshake(
    subprotocolsHeader?: string,
    authToken?: string
  ): WsHandshakeResult {
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
        rejectionReason: `No requested subprotocol matching supported set: ${this.supportedProtocols.join(', ')}`
      };
    }

    return {
      accepted: true,
      selectedSubprotocol: selected,
      userId: 'user-session'
    };
  }
}
