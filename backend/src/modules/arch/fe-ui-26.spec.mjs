import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WebAudioKeystrokeSynthesizerService } from './fe-ui-26.service.ts';

describe('WebAudioKeystrokeSynthesizerService (FE-UI-26)', () => {
  it('generates clamped audio synthesis configurations for keyboard actions', () => {
    const synth = new WebAudioKeystrokeSynthesizerService();

    const enter = synth.getToneForKey('Enter');
    assert.strictEqual(enter.frequency, 523.25);
    assert.ok(enter.gain <= 0.2);

    const normalChar = synth.getToneForKey('a');
    assert.ok(normalChar.frequency > 200);
    assert.strictEqual(normalChar.waveform, 'triangle');
  });
});
