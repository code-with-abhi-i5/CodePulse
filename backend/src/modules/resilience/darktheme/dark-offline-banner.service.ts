export class DarkThemeOfflineBanner {
  public getBannerTheme(): { background: string; text: string; borderTop: string } {
    return {
      background: '#7F1D1D', // High contrast red-900
      text: '#FEF2F2',
      borderTop: '2px solid #EF4444'
    };
  }
}
