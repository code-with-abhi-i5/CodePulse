import assert from 'node:assert/strict';
import test from 'node:test';

class WebrtcVoiceService {
  constructor() {
    this.sessions = new Map();
  }

  negotiatePeer(peerId, roomId, sdp) {
    const session = { peerId, roomId, sdp, bitrateKbps: 32, codec: 'opus' };
    this.sessions.set(peerId, session);
    return session;
  }

  adaptBitrate(peerId, packetLossPercent) {
    const session = this.sessions.get(peerId);
    if (!session) return 32;
    if (packetLossPercent > 10) session.bitrateKbps = 16;
    else if (packetLossPercent < 2) session.bitrateKbps = 48;
    return session.bitrateKbps;
  }

  terminateSession(peerId) {
    return this.sessions.delete(peerId);
  }
}

test('WebrtcVoiceService: negotiates WebRTC session and adapts Opus bitrate on network loss', () => {
  const voice = new WebrtcVoiceService();
  const session = voice.negotiatePeer('peer-99', 'battle-42', 'v=0\no=- 123 IN IP4 0.0.0.0');
  assert.equal(session.codec, 'opus');
  assert.equal(session.bitrateKbps, 32);

  const adaptedLow = voice.adaptBitrate('peer-99', 15);
  assert.equal(adaptedLow, 16);

  const adaptedHigh = voice.adaptBitrate('peer-99', 1);
  assert.equal(adaptedHigh, 48);
});
