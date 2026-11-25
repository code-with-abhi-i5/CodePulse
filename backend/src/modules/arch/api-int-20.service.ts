/**
 * Architecture Service: Server-Sent Events (SSE) Streaming Gateway
 * Subsystem: Real-Time Log Streaming
 */

export interface SseMessage {
  id?: string;
  event?: string;
  data: string;
  retryMs?: number;
}

export class SseStreamingGatewayService {
  public formatMessage(msg: SseMessage): string {
    let out = '';
    if (msg.id) out += `id: ${msg.id}\n`;
    if (msg.event) out += `event: ${msg.event}\n`;
    if (msg.retryMs) out += `retry: ${msg.retryMs}\n`;

    const lines = msg.data.split('\n');
    for (const line of lines) {
      out += `data: ${line}\n`;
    }
    out += '\n';
    return out;
  }
}
