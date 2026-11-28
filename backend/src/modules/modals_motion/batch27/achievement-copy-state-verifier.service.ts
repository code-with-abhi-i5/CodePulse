export class AchievementCopyStateVerifier {
  verifyClipboardCopy(targetUrl: string, clipboardContents: string): boolean {
    return Boolean(targetUrl && targetUrl === clipboardContents);
  }
}
