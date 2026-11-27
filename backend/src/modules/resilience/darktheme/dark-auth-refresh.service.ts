export class DarkThemeAuthRefreshInterceptor {
  public getRefreshOverlayStyle(): { overlayBg: string; spinnerColor: string } {
    return {
      overlayBg: 'rgba(15, 23, 42, 0.85)',
      spinnerColor: '#38BDF8'
    };
  }
}
