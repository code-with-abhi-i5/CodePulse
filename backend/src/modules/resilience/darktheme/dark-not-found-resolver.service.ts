export class DarkThemeNotFoundResolver {
  public getCardTheme(): { cardBg: string; text: string; hoverBorder: string } {
    return {
      cardBg: '#1E293B',
      text: '#F8FAFC',
      hoverBorder: '#60A5FA'
    };
  }
}
