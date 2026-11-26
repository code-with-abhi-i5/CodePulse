export type PluginPermission =
  | 'network'
  | 'storage'
  | 'notifications'
  | 'editor-read'
  | 'editor-write';

export const ALL_PLUGIN_PERMISSIONS: readonly PluginPermission[] = [
  'network',
  'storage',
  'notifications',
  'editor-read',
  'editor-write',
] as const;

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  entryHtmlOrScript: string;
  allowedOrigins: string[];
  permissions: PluginPermission[];
}

export interface InstalledPluginState {
  manifest: PluginManifest;
  enabled: boolean;
  grantedPermissions: PluginPermission[];
}

export const DEFAULT_INSTALLED_PLUGINS: InstalledPluginState[] = [
  {
    manifest: {
      id: 'coding-music-widget',
      name: 'Coding Focus Audio Widget',
      version: '1.2.0',
      author: 'CodePulse Community',
      description: 'Displays current coding focus track and playback controls.',
      entryHtmlOrScript: '<div>Focus Beats · Lo-Fi Synth</div>',
      allowedOrigins: ['https://codepulse.local', 'http://localhost:3000'],
      permissions: ['network', 'storage'],
    },
    enabled: true,
    grantedPermissions: ['network', 'storage'],
  },
  {
    manifest: {
      id: 'leetcode-sync-widget',
      name: 'LeetCode Streak Sync',
      version: '1.0.4',
      author: 'CodePulse Community',
      description: 'Syncs solved problem counts and daily streak status.',
      entryHtmlOrScript: '<div>LeetCode Daily Sync Active</div>',
      allowedOrigins: ['https://codepulse.local', 'http://localhost:3000'],
      permissions: ['network', 'storage', 'notifications'],
    },
    enabled: true,
    grantedPermissions: ['network', 'storage'],
  },
  {
    manifest: {
      id: 'pomodoro-timer-widget',
      name: 'Pomodoro Sprint Timer',
      version: '1.1.0',
      author: 'CodePulse Community',
      description: '25/5 focus sprint timer with completion notifications.',
      entryHtmlOrScript: '<div>Sprint Timer: 25:00</div>',
      allowedOrigins: ['https://codepulse.local', 'http://localhost:3000'],
      permissions: ['storage', 'notifications'],
    },
    enabled: true,
    grantedPermissions: ['storage', 'notifications'],
  },
  {
    manifest: {
      id: 'discord-presence-widget',
      name: 'Discord Rich Presence',
      version: '0.9.2',
      author: 'CodePulse Community',
      description: 'Publishes active editor language and battle status to Discord.',
      entryHtmlOrScript: '<div>Discord RPC Ready</div>',
      allowedOrigins: ['https://codepulse.local', 'http://localhost:3000'],
      permissions: ['network', 'editor-read'],
    },
    enabled: false,
    grantedPermissions: ['editor-read'],
  },
];
