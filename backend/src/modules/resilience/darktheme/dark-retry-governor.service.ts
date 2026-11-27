export class DarkThemeRetryGovernor {
  public getRetryIndicatorStyle(isRetrying: boolean): { color: string; pulse: boolean } {
    return isRetrying
      ? { color: '#FBBF24', pulse: true } // Amber pulse
      : { color: '#34D399', pulse: false }; // Emerald connected
  }
}
