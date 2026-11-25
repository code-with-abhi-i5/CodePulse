import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AvatarCustomizerConfigService } from './fe-ui-34.service.ts';

describe('AvatarCustomizerConfigService (FE-UI-34)', () => {
  it('validates 3D avatar customizer configurations and material color palettes', () => {
    const service = new AvatarCustomizerConfigService();
    const valid = service.validateAndFormatConfig({
      skinColor: '#fcd3a1',
      hairStyle: 'SPIKY',
      hairColor: '#4a2c11',
      clothingColor: '#0969da'
    });

    assert.strictEqual(valid.valid, true);
    assert.strictEqual(valid.formatted.accessory, 'NONE');

    const invalid = service.validateAndFormatConfig({
      skinColor: 'not-a-hex',
      hairStyle: 'SPIKY',
      hairColor: '#123456',
      clothingColor: '#123456'
    });
    assert.strictEqual(invalid.valid, false);
    assert.match(invalid.error, /valid hex codes/i);
  });
});
