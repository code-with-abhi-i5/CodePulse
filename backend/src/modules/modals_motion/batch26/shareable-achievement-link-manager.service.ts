export class ShareableAchievementLinkManager {
  generateShareLink(achievementId: string, baseUrl = 'https://codepulse.io'): string {
    if (!achievementId) throw new Error('Achievement ID is required');
    const safeId = encodeURIComponent(achievementId);
    return `${baseUrl}/achievements/${safeId}?shared=true`;
  }

  getCopyState(lastCopiedTimestamp: number, feedbackWindowMs = 2000): { copied: boolean; icon: string } {
    const elapsed = Date.now() - lastCopiedTimestamp;
    const isRecent = elapsed >= 0 && elapsed <= feedbackWindowMs;
    return {
      copied: isRecent,
      icon: isRecent ? 'checkmark-animated' : 'copy-outline'
    };
  }
}
