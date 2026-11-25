/**
 * Architecture Service: Browser Notification Permission Manager
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-48]
 */

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'cooldown';

export interface NotificationPreferences {
  battleInvites: boolean;
  tournamentUpdates: boolean;
  achievements: boolean;
}

export class NotificationPermissionManagerService {
  private state: NotificationPermissionState;
  private actionCount: number;
  private requiredActions: number;
  private lastDismissedTimestamp: number;
  private cooldownMs: number;
  private preferences: NotificationPreferences;

  constructor(requiredActions: number = 3, cooldownMs: number = 86400000) {
    this.state = 'default';
    this.actionCount = 0;
    this.requiredActions = requiredActions;
    this.lastDismissedTimestamp = 0;
    this.cooldownMs = cooldownMs;
    this.preferences = {
      battleInvites: true,
      tournamentUpdates: true,
      achievements: false
    };
  }

  public recordEngagementAction(): void {
    this.actionCount++;
  }

  public shouldShowContextualPrompt(now: number = Date.now()): boolean {
    if (this.state === 'granted' || this.state === 'denied') return false;
    if (this.lastDismissedTimestamp > 0 && now - this.lastDismissedTimestamp < this.cooldownMs) return false;
    return this.actionCount >= this.requiredActions;
  }

  public dismissPrompt(now: number = Date.now()): void {
    this.lastDismissedTimestamp = now;
  }

  public setPermission(perm: 'granted' | 'denied'): void {
    this.state = perm;
  }

  public getPermission(): NotificationPermissionState {
    return this.state;
  }

  public setPreference(key: keyof NotificationPreferences, enabled: boolean): void {
    this.preferences[key] = enabled;
  }

  public getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }
}
