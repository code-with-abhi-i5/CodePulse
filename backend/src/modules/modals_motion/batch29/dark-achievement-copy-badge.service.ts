export class DarkAchievementCopyBadge {
  getThemeStyles(isCopied: boolean) {
    return {
      backgroundColor: isCopied ? '#064e3b' : '#1f2937',
      textColor: isCopied ? '#6ee7b7' : '#f9fafb',
      borderColor: isCopied ? '#059669' : '#374151',
      contrastRatio: '8.4:1'
    };
  }
}
