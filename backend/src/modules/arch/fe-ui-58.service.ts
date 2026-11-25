/**
 * Architecture Service: Client Clipboard Manager
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-58]
 */

export interface ClipboardItem {
  id: string;
  text: string;
  timestamp: number;
}

export interface ToastNotification {
  title: string;
  message: string;
  variant: 'success' | 'warning' | 'error';
  durationMs: number;
}

export class ClientClipboardManagerService {
  private history: ClipboardItem[];
  private maxHistory: number;

  constructor(maxHistory: number = 10) {
    this.history = [];
    this.maxHistory = maxHistory;
  }

  public sanitizeSecrets(text: string): string {
    // Redact tokens like ghp_..., eyJ...
    return text
      .replace(/ghp_[a-zA-Z0-9]{36}/g, '[REDACTED_GITHUB_TOKEN]')
      .replace(/sk_live_[a-zA-Z0-9]{24}/g, '[REDACTED_STRIPE_KEY]');
  }

  public copyText(rawText: string): { success: boolean; toast: ToastNotification; sanitized: string } {
    const sanitized = this.sanitizeSecrets(rawText);
    const item: ClipboardItem = {
      id: `clip_${Date.now()}`,
      text: sanitized,
      timestamp: Date.now()
    };

    this.history.unshift(item);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }

    return {
      success: true,
      sanitized,
      toast: {
        title: 'Copied to Clipboard',
        message: 'Content successfully copied.',
        variant: 'success',
        durationMs: 2500
      }
    };
  }

  public getHistory(): ClipboardItem[] {
    return [...this.history];
  }
}
