/**
 * Architecture Service: Monaco Zen Mode Configuration
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-65]
 */

export interface TypographySettings {
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
}

export class MonacoZenModeConfigService {
  private zenActive: boolean;
  private typography: TypographySettings;

  constructor() {
    this.zenActive = false;
    this.typography = {
      fontSize: 14,
      lineHeight: 22,
      fontFamily: 'Fira Code, monospace'
    };
  }

  public toggleZenMode(): boolean {
    this.zenActive = !this.zenActive;
    return this.zenActive;
  }

  public isZenMode(): boolean {
    return this.zenActive;
  }

  public setTypography(settings: Partial<TypographySettings>): void {
    this.typography = { ...this.typography, ...settings };
  }

  public getEditorOptions(): Record<string, any> {
    if (this.zenActive) {
      return {
        minimap: { enabled: false },
        lineNumbers: 'off',
        glyphMargin: false,
        folding: false,
        fontSize: this.typography.fontSize + 2,
        lineHeight: this.typography.lineHeight + 4,
        fontFamily: this.typography.fontFamily
      };
    }
    return {
      minimap: { enabled: true },
      lineNumbers: 'on',
      glyphMargin: true,
      folding: true,
      fontSize: this.typography.fontSize,
      lineHeight: this.typography.lineHeight,
      fontFamily: this.typography.fontFamily
    };
  }
}
