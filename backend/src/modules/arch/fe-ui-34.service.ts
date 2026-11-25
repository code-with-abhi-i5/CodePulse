/**
 * Architecture Service: 3D Developer Avatar Customizer Config
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-34]
 */

export interface AvatarAttributes {
  skinColor: string;
  hairStyle: 'BUZZ' | 'LONG' | 'SPIKY';
  hairColor: string;
  clothingColor: string;
  accessory?: 'GLASSES' | 'HEADPHONES' | 'NONE';
}

export class AvatarCustomizerConfigService {
  private allowedHairStyles: Set<string> = new Set(['BUZZ', 'LONG', 'SPIKY']);
  private hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

  public validateAndFormatConfig(attrs: AvatarAttributes): { valid: boolean; formatted?: AvatarAttributes; error?: string } {
    if (!this.allowedHairStyles.has(attrs.hairStyle)) {
      return { valid: false, error: `Invalid hairStyle '${attrs.hairStyle}'` };
    }

    if (!this.hexColorRegex.test(attrs.skinColor) || !this.hexColorRegex.test(attrs.hairColor)) {
      return { valid: false, error: 'Color attributes must be valid hex codes (#RRGGBB)' };
    }

    return {
      valid: true,
      formatted: {
        ...attrs,
        accessory: attrs.accessory || 'NONE'
      }
    };
  }
}
