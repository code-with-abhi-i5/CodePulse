export class WcagNotFoundNavigationA11y {
  public getNavA11yProps(): { role: string; ariaLabel: string } {
    return {
      role: 'navigation',
      ariaLabel: 'Suggested Pages'
    };
  }

  public getHeadingAriaProps(): { role: string; ariaLevel: number } {
    return {
      role: 'heading',
      ariaLevel: 1
    };
  }
}
