export interface RoutedSocketFrame {
  channelId: number;
  messageType: number;
  payloadLength: number;
  payload: Buffer;
}

export class ZeroCopySocketBufferRouter {
  public parseFrame(buffer: Buffer): RoutedSocketFrame | null {
    // Protocol frame format:
    // [0..1] Magic Bytes: 0x43 0x50 ('CP')
    // [2..3] Channel ID: UInt16BE
    // [4..5] Message Type: UInt16BE
    // [6..9] Payload Length: UInt32BE
    // [10..10+PayloadLength] Payload Buffer Slice (zero-copy)
    if (buffer.length < 10) return null;
    if (buffer[0] !== 0x43 || buffer[1] !== 0x50) return null;

    const channelId = buffer.readUInt16BE(2);
    const messageType = buffer.readUInt16BE(4);
    const payloadLength = buffer.readUInt32BE(6);

    if (buffer.length < 10 + payloadLength) return null;

    // Use subarray for zero-copy view of buffer
    const payload = buffer.subarray(10, 10 + payloadLength);

    return {
      channelId,
      messageType,
      payloadLength,
      payload
    };
  }

  public createFrame(channelId: number, messageType: number, payload: Buffer): Buffer {
    const header = Buffer.alloc(10);
    header[0] = 0x43;
    header[1] = 0x50;
    header.writeUInt16BE(channelId, 2);
    header.writeUInt16BE(messageType, 4);
    header.writeUInt32BE(payload.length, 6);

    return Buffer.concat([header, payload]);
  }
}
