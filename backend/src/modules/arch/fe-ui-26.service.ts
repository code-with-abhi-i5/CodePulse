/**
 * Architecture Service: WebAudio Keystroke Synthesizer
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-26]
 */

export interface SynthToneConfig {
  frequency: number;
  durationMs: number;
  gain: number;
  waveform: 'sine' | 'square' | 'triangle';
}

export class WebAudioKeystrokeSynthesizerService {
  private keyFrequencyMap: Map<string, number>;

  constructor() {
    this.keyFrequencyMap = new Map();
    // Musical pentatonic scale for pleasant mechanical typing sound
    this.keyFrequencyMap.set('Enter', 523.25); // C5
    this.keyFrequencyMap.set('Backspace', 392.00); // G4
    this.keyFrequencyMap.set('Space', 261.63); // C4
  }

  public getToneForKey(key: string): SynthToneConfig {
    const freq = this.keyFrequencyMap.get(key) || (300 + (key.charCodeAt(0) % 30) * 15);
    return {
      frequency: freq,
      durationMs: 40,
      gain: 0.15, // Clamped to prevent audio distortion
      waveform: 'triangle'
    };
  }
}
