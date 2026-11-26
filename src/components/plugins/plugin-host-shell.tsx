'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Shield, Puzzle, Power, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import {
  ALL_PLUGIN_PERMISSIONS,
  DEFAULT_INSTALLED_PLUGINS,
  InstalledPluginState,
  PluginPermission,
} from '../../types/plugin-manifest';
import {
  attachVerifiedMessageListener,
  PluginSandboxBridge,
  PluginRpcResponse,
} from '../../lib/plugins/plugin-sandbox';

export interface PluginHostShellProps {
  initialPlugins?: InstalledPluginState[];
  useIframeFallback?: boolean;
  onRpcResponse?: (resp: PluginRpcResponse) => void;
}

export const PluginHostShell: React.FC<PluginHostShellProps> = ({
  initialPlugins = DEFAULT_INSTALLED_PLUGINS,
  useIframeFallback = false,
  onRpcResponse,
}) => {
  const [plugins, setPlugins] = useState<InstalledPluginState[]>(initialPlugins);
  const [selectedId, setSelectedId] = useState<string>(initialPlugins[0]?.manifest.id ?? '');
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const shadowHostRef = useRef<HTMLDivElement | null>(null);

  const activePlugin = useMemo(
    () => plugins.find((p) => p.manifest.id === selectedId) ?? plugins[0],
    [plugins, selectedId],
  );

  const bridge = useMemo(() => {
    if (!activePlugin) return null;
    return new PluginSandboxBridge(
      activePlugin.manifest,
      activePlugin.grantedPermissions,
      activePlugin.enabled,
    );
  }, [activePlugin]);

  // Attach verified window postMessage RPC listener for active plugin
  useEffect(() => {
    if (!bridge || typeof window === 'undefined') return;
    return attachVerifiedMessageListener(bridge, window, (resp) => {
      if (!resp.ok && resp.error) {
        setRuntimeError(resp.error);
      } else {
        setRuntimeError(null);
      }
      onRpcResponse?.(resp);
    });
  }, [bridge, onRpcResponse]);

  // Encapsulate third-party widget markup inside Shadow DOM with host style isolation
  useEffect(() => {
    if (useIframeFallback || !activePlugin || !shadowHostRef.current) return;
    const hostEl = shadowHostRef.current;

    try {
      const root =
        hostEl.shadowRoot ??
        (typeof hostEl.attachShadow === 'function'
          ? hostEl.attachShadow({ mode: 'open' })
          : null);

      if (root) {
        root.innerHTML = '';
        const styleEl = document.createElement('style');
        styleEl.textContent = `:host { all: initial; display: block; font-family: system-ui, sans-serif; color: #f4f4f5; }`;
        const mountEl = document.createElement('div');
        mountEl.setAttribute('data-testid', 'shadow-widget-mount');
        mountEl.innerHTML = activePlugin.enabled
          ? activePlugin.manifest.entryHtmlOrScript
          : '<em>Plugin disabled</em>';
        root.appendChild(styleEl);
        root.appendChild(mountEl);
      }
    } catch (err: any) {
      setRuntimeError(err?.message ?? 'Failed to isolate plugin inside Shadow DOM');
    }
  }, [activePlugin, useIframeFallback]);

  const togglePluginEnabled = (pluginId: string) => {
    setPlugins((prev) =>
      prev.map((item) =>
        item.manifest.id === pluginId ? { ...item, enabled: !item.enabled } : item,
      ),
    );
  };

  const togglePermission = (pluginId: string, permission: PluginPermission) => {
    setPlugins((prev) =>
      prev.map((item) => {
        if (item.manifest.id !== pluginId) return item;
        const exists = item.grantedPermissions.includes(permission);
        const nextPerms = exists
          ? item.grantedPermissions.filter((p) => p !== permission)
          : [...item.grantedPermissions, permission];
        return { ...item, grantedPermissions: nextPerms };
      }),
    );
  };

  if (!activePlugin) {
    return null;
  }

  return (
    <div
      data-testid="plugin-host-shell"
      data-isolation-mode={useIframeFallback ? 'sandboxed-iframe' : 'shadow-dom'}
      className="grid gap-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-100 lg:grid-cols-3"
    >
      {/* Installed Plugins & Enable/Disable Controls */}
      <div className="space-y-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-300">
          <Puzzle className="h-4 w-4" />
          <span>Installed Extensions</span>
        </div>

        <div className="space-y-2">
          {plugins.map((item) => {
            const isSelected = item.manifest.id === activePlugin.manifest.id;
            return (
              <div
                key={item.manifest.id}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                  isSelected
                    ? 'border-indigo-500/60 bg-indigo-950/30'
                    : 'border-zinc-800 bg-zinc-950/70'
                }`}
              >
                <button
                  type="button"
                  data-testid={`select-plugin-${item.manifest.id}`}
                  onClick={() => setSelectedId(item.manifest.id)}
                  className="text-left font-semibold text-white hover:underline"
                >
                  {item.manifest.name}
                </button>
                <button
                  type="button"
                  data-testid={`toggle-plugin-${item.manifest.id}`}
                  aria-pressed={item.enabled}
                  onClick={() => togglePluginEnabled(item.manifest.id)}
                  className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold ${
                    item.enabled
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  <Power className="h-3 w-3" />
                  {item.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Isolated Widget Mount + Permission Settings */}
      <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 lg:col-span-2">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white">{activePlugin.manifest.name}</h2>
            <p className="text-xs text-zinc-400">{activePlugin.manifest.description}</p>
          </div>
          <span className="rounded-md bg-zinc-800 px-2.5 py-1 font-mono text-[11px] text-cyan-300">
            v{activePlugin.manifest.version}
          </span>
        </div>

        {/* Sandboxed Widget Viewport */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          {useIframeFallback ? (
            <iframe
              data-testid="plugin-sandbox-iframe"
              title={activePlugin.manifest.name}
              sandbox="allow-scripts"
              srcDoc={`<!doctype html><html><body>${activePlugin.enabled ? activePlugin.manifest.entryHtmlOrScript : 'Disabled'}</body></html>`}
              className="h-24 w-full rounded border-0"
            />
          ) : (
            <div ref={shadowHostRef} data-testid="plugin-shadow-host" />
          )}
        </div>

        {/* Permission Configuration Matrix */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
            <Shield className="h-4 w-4" />
            <span>Manifest Permissions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_PLUGIN_PERMISSIONS.map((perm) => {
              const granted = activePlugin.grantedPermissions.includes(perm);
              return (
                <button
                  key={perm}
                  type="button"
                  data-testid={`perm-toggle-${activePlugin.manifest.id}-${perm}`}
                  aria-pressed={granted}
                  onClick={() => togglePermission(activePlugin.manifest.id, perm)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono ${
                    granted
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                      : 'border-zinc-700 bg-zinc-950 text-zinc-400'
                  }`}
                >
                  {granted ? (
                    <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Square className="h-3.5 w-3.5 text-zinc-500" />
                  )}
                  {perm}
                </button>
              );
            })}
          </div>
        </div>

        {runtimeError && (
          <div
            data-testid="plugin-sandbox-error"
            className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-950/40 p-2.5 text-xs text-rose-200"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{runtimeError}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PluginHostShell;
