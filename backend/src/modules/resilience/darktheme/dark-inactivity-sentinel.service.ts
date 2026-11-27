export class DarkThemeInactivitySentinel {
  public getDialogTheme(): { modalBg: string; textPrimary: string; warningAccent: string } {
    return {
      modalBg: '#0F172A',
      textPrimary: '#F8FAFC',
      warningAccent: '#F59E0B' // Amber-500 for high-contrast dark warning
    };
  }
}
