/**
 * Architecture Service: Accessible High-Contrast Color Scheme
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-41]
 */

export interface ContrastResult {
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
}

export class AccessibleColorSchemeService {
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const clean = hex.replace('#', '');
    const num = parseInt(clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  public getRelativeLuminance(hex: string): number {
    const { r, g, b } = this.hexToRgb(hex);
    const [rs, gs, bs] = [r, g, b].map(v => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  public getContrastRatio(fgHex: string, bgHex: string): number {
    const l1 = this.getRelativeLuminance(fgHex);
    const l2 = this.getRelativeLuminance(bgHex);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    const ratio = (lighter + 0.05) / (darker + 0.05);
    return Math.round(ratio * 100) / 100;
  }

  public verifyContrast(fgHex: string, bgHex: string): ContrastResult {
    const ratio = this.getContrastRatio(fgHex, bgHex);
    return {
      ratio,
      wcagAA: ratio >= 4.5,
      wcagAAA: ratio >= 7.0
    };
  }

  public getHighContrastAlternative(fgHex: string, bgHex: string): string {
    const bgLum = this.getRelativeLuminance(bgHex);
    return bgLum > 0.5 ? '#000000' : '#ffffff';
  }
}
