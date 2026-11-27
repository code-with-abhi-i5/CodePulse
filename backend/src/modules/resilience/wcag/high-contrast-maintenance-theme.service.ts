export class HighContrastMaintenanceThemeService {
  public getThemeConfig(highContrast = true): {
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    contrastRatio: string;
  } {
    if (highContrast) {
      return {
        backgroundColor: '#000000',
        textColor: '#FFFFFF',
        accentColor: '#FFFF00', // Yellow accent for high visibility
        contrastRatio: '21:1'
      };
    }
    return {
      backgroundColor: '#0F172A',
      textColor: '#F8FAFC',
      accentColor: '#38BDF8',
      contrastRatio: '14:1'
    };
  }
}
