/**
 * Architecture Service: Dynamic Social Share Card Preview
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-64]
 */

export interface ShareCardConfig {
  title: string;
  handle: string;
  score: number;
  rank: string;
  theme: 'dark' | 'light';
}

export class SocialShareCardPreviewService {
  public generateSvgCard(config: ShareCardConfig): string {
    const bg = config.theme === 'dark' ? '#0f172a' : '#f8fafc';
    const text = config.theme === 'dark' ? '#f8fafc' : '#0f172a';
    const accent = '#6366f1';

    return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${bg}"/>
  <text x="80" y="140" font-family="sans-serif" font-size="56" font-weight="bold" fill="${text}">${config.title}</text>
  <text x="80" y="240" font-family="sans-serif" font-size="32" fill="#94a3b8">@${config.handle}</text>
  <rect x="80" y="320" width="300" height="120" rx="16" fill="${accent}" opacity="0.15"/>
  <text x="110" y="380" font-family="sans-serif" font-size="24" fill="#94a3b8">Rating</text>
  <text x="110" y="420" font-family="sans-serif" font-size="36" font-weight="bold" fill="${accent}">${config.score} (${config.rank})</text>
  <text x="80" y="560" font-family="sans-serif" font-size="28" font-weight="bold" fill="${accent}">CodePulse Platform</text>
</svg>`;
  }
}
