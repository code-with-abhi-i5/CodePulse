export class DarkThemeErrorBoundary {
  public getCrashFallbackStyle(): { cardBg: string; titleColor: string; buttonBg: string } {
    return {
      cardBg: '#18181B',
      titleColor: '#F87171', // Red-400
      buttonBg: '#2563EB'
    };
  }
}
