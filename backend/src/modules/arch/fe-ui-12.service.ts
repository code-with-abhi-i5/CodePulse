/**
 * Architecture Service: Dynamic Theme Variable Switcher & Hydrator
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-12]
 */

export interface ThemeTokens {
  bgPrimary: string;
  textPrimary: string;
  accent: string;
  border: string;
}

export class DynamicThemeHydratorService {
  private themes: Map<string, ThemeTokens>;

  constructor() {
    this.themes = new Map();
    this.themes.set('dark', {
      bgPrimary: '#0d1117',
      textPrimary: '#c9d1d9',
      accent: '#58a6ff',
      border: '#30363d'
    });
    this.themes.set('light', {
      bgPrimary: '#ffffff',
      textPrimary: '#24292f',
      accent: '#0969da',
      border: '#d0d7de'
    });
  }

  public generateCssVariables(themeName: string): string {
    const theme = this.themes.get(themeName) || this.themes.get('dark')!;
    return [
      `:root {`,
      `  --bg-primary: ${theme.bgPrimary};`,
      `  --text-primary: ${theme.textPrimary};`,
      `  --accent: ${theme.accent};`,
      `  --border: ${theme.border};`,
      `}`
    ].join('\n');
  }

  public generateInlineHydrationScript(): string {
    return `<script>(function(){const t=localStorage.getItem('codepulse-theme')||'dark';document.documentElement.setAttribute('data-theme',t);})();</script>`;
  }
}
