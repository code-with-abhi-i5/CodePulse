export class AchievementClipboardCopyController {
  formatSharePayload(achievementTitle: string, shareUrl: string): string {
    return `I just unlocked ${achievementTitle} on CodePulse! Check it out: ${shareUrl}`;
  }
}
