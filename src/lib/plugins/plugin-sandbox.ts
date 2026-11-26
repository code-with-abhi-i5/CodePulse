import { PluginManifest, PluginPermission } from '../../types/plugin-manifest';

export type PluginRpcAction =
  | 'storage.get'
  | 'storage.set'
  | 'network.fetch'
  | 'notifications.notify'
  | 'editor.readBuffer'
  | 'editor.writeBuffer';

export interface PluginRpcMessage {
  rpcId: string;
  pluginId: string;
  origin: string;
  action: PluginRpcAction;
  payload?: unknown;
}

export interface PluginRpcResponse {
  rpcId: string;
  ok: boolean;
  data?: unknown;
  error?: string;
}

const ACTION_REQUIRED_PERMISSION: Record<PluginRpcAction, PluginPermission> = {
  'storage.get': 'storage',
  'storage.set': 'storage',
  'network.fetch': 'network',
  'notifications.notify': 'notifications',
  'editor.readBuffer': 'editor-read',
  'editor.writeBuffer': 'editor-write',
};

export class PluginSandboxBridge {
  private readonly pluginStore = new Map<string, Record<string, unknown>>();
  private readonly notifications: Array<{ pluginId: string; message: string }> = [];
  private editorBuffer = '// CodePulse workspace buffer';

  constructor(
    private readonly manifest: PluginManifest,
    private grantedPermissions: Set<PluginPermission> = new Set(manifest.permissions),
    private enabled = true,
  ) {}

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setGrantedPermissions(permissions: PluginPermission[]): void {
    this.grantedPermissions = new Set(permissions);
  }

  getGrantedPermissions(): PluginPermission[] {
    return Array.from(this.grantedPermissions);
  }

  getNotifications(): Array<{ pluginId: string; message: string }> {
    return [...this.notifications];
  }

  isOriginAllowed(origin: string): boolean {
    if (!origin) return false;
    if (this.manifest.allowedOrigins.includes('*')) return true;
    return this.manifest.allowedOrigins.includes(origin);
  }

  hasPermission(permission: PluginPermission): boolean {
    return this.enabled && this.grantedPermissions.has(permission);
  }

  /**
   * Handles incoming postMessage RPC calls with strict origin verification,
   * capability permission enforcement, and isolated crash/error boundaries.
   */
  async handleRpcMessage(msg: PluginRpcMessage): Promise<PluginRpcResponse> {
    if (!this.enabled) {
      return {
        rpcId: msg.rpcId,
        ok: false,
        error: `Plugin "${this.manifest.id}" is currently disabled.`,
      };
    }

    if (msg.pluginId !== this.manifest.id) {
      return {
        rpcId: msg.rpcId,
        ok: false,
        error: `Plugin ID mismatch: expected "${this.manifest.id}".`,
      };
    }

    if (!this.isOriginAllowed(msg.origin)) {
      return {
        rpcId: msg.rpcId,
        ok: false,
        error: `Untrusted postMessage origin "${msg.origin}" rejected for plugin "${this.manifest.id}".`,
      };
    }

    const requiredPerm = ACTION_REQUIRED_PERMISSION[msg.action];
    if (!this.hasPermission(requiredPerm)) {
      return {
        rpcId: msg.rpcId,
        ok: false,
        error: `Permission denied: "${requiredPerm}" is not granted for plugin "${this.manifest.id}".`,
      };
    }

    try {
      switch (msg.action) {
        case 'storage.get': {
          const key = String((msg.payload as any)?.key ?? '');
          const bucket = this.pluginStore.get(this.manifest.id) ?? {};
          return { rpcId: msg.rpcId, ok: true, data: bucket[key] ?? null };
        }
        case 'storage.set': {
          const key = String((msg.payload as any)?.key ?? '');
          const value = (msg.payload as any)?.value ?? null;
          const bucket = this.pluginStore.get(this.manifest.id) ?? {};
          bucket[key] = value;
          this.pluginStore.set(this.manifest.id, bucket);
          return { rpcId: msg.rpcId, ok: true, data: { stored: true, key } };
        }
        case 'network.fetch': {
          const url = String((msg.payload as any)?.url ?? '');
          if (!url.startsWith('https://') && !url.startsWith('http://')) {
            return { rpcId: msg.rpcId, ok: false, error: 'Invalid URL protocol.' };
          }
          return { rpcId: msg.rpcId, ok: true, data: { url, status: 200, proxied: true } };
        }
        case 'notifications.notify': {
          const message = String((msg.payload as any)?.message ?? '');
          this.notifications.push({ pluginId: this.manifest.id, message });
          return { rpcId: msg.rpcId, ok: true, data: { delivered: true } };
        }
        case 'editor.readBuffer': {
          return { rpcId: msg.rpcId, ok: true, data: { content: this.editorBuffer } };
        }
        case 'editor.writeBuffer': {
          const nextContent = String((msg.payload as any)?.content ?? '');
          this.editorBuffer = nextContent;
          return { rpcId: msg.rpcId, ok: true, data: { bytesWritten: nextContent.length } };
        }
        default:
          return { rpcId: msg.rpcId, ok: false, error: 'Unsupported RPC action.' };
      }
    } catch (err: any) {
      return {
        rpcId: msg.rpcId,
        ok: false,
        error: `Sandbox caught plugin runtime error: ${err?.message ?? 'unknown error'}`,
      };
    }
  }
}

export function attachVerifiedMessageListener(
  bridge: PluginSandboxBridge,
  targetWindow: Window = window,
  onResponse?: (resp: PluginRpcResponse) => void,
): () => void {
  const listener = async (event: MessageEvent) => {
    const data = event.data as PluginRpcMessage | undefined;
    if (!data || typeof data !== 'object' || !data.rpcId || !data.action) {
      return;
    }
    const effectiveOrigin = event.origin || data.origin;
    const response = await bridge.handleRpcMessage({
      ...data,
      origin: effectiveOrigin,
    });
    onResponse?.(response);
  };

  targetWindow.addEventListener('message', listener);
  return () => targetWindow.removeEventListener('message', listener);
}
