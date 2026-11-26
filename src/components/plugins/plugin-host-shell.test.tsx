import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DEFAULT_INSTALLED_PLUGINS } from '../../types/plugin-manifest';
import { PluginSandboxBridge } from '../../lib/plugins/plugin-sandbox';
import { PluginHostShell } from './plugin-host-shell';

describe('Micro-Frontend Plugin Shell (postMessage RPC, Permissions & Sandbox Isolation)', () => {
  it('enforces origin verification and granted manifest permissions on postMessage RPC calls', async () => {
    const manifest = DEFAULT_INSTALLED_PLUGINS[2].manifest; // pomodoro-timer-widget: storage, notifications
    const bridge = new PluginSandboxBridge(manifest, ['storage'], true);

    // Reject untrusted origin
    const badOrigin = await bridge.handleRpcMessage({
      rpcId: 'rpc-1',
      pluginId: manifest.id,
      origin: 'https://evil-attacker.example',
      action: 'storage.get',
      payload: { key: 'sprintCount' },
    });
    expect(badOrigin.ok).toBe(false);
    expect(badOrigin.error).toContain('Untrusted postMessage origin');

    // Deny ungranted 'notifications' permission
    const deniedPerm = await bridge.handleRpcMessage({
      rpcId: 'rpc-2',
      pluginId: manifest.id,
      origin: 'https://codepulse.local',
      action: 'notifications.notify',
      payload: { message: 'Sprint finished!' },
    });
    expect(deniedPerm.ok).toBe(false);
    expect(deniedPerm.error).toContain('Permission denied');

    // Allow granted 'storage' permission
    const writeRes = await bridge.handleRpcMessage({
      rpcId: 'rpc-3',
      pluginId: manifest.id,
      origin: 'https://codepulse.local',
      action: 'storage.set',
      payload: { key: 'sprintCount', value: 4 },
    });
    expect(writeRes.ok).toBe(true);

    const readRes = await bridge.handleRpcMessage({
      rpcId: 'rpc-4',
      pluginId: manifest.id,
      origin: 'https://codepulse.local',
      action: 'storage.get',
      payload: { key: 'sprintCount' },
    });
    expect(readRes.ok).toBe(true);
    expect(readRes.data).toBe(4);
  });

  it('isolates plugin widgets inside Shadow DOM or sandboxed iframe and lets users toggle enable/permissions', () => {
    render(<PluginHostShell initialPlugins={DEFAULT_INSTALLED_PLUGINS} />);

    expect(screen.getByTestId('plugin-host-shell').getAttribute('data-isolation-mode')).toBe(
      'shadow-dom',
    );

    const toggleBtn = screen.getByTestId('toggle-plugin-coding-music-widget');
    expect(toggleBtn.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(toggleBtn);
    expect(toggleBtn.getAttribute('aria-pressed')).toBe('false');

    const permBtn = screen.getByTestId('perm-toggle-coding-music-widget-notifications');
    expect(permBtn.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(permBtn);
    expect(permBtn.getAttribute('aria-pressed')).toBe('true');
  });
});
