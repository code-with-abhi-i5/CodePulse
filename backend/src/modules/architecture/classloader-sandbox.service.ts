export interface SandboxResult {
  success: boolean;
  result?: any;
  blockedCalls: string[];
  error?: string;
}

export class TenantDynamicClassloaderSandbox {
  private forbiddenModules = new Set([
    'child_process',
    'fs',
    'net',
    'http',
    'tls',
    'cluster',
    'process'
  ]);

  public executeSafely(code: string, context: Record<string, any> = {}): SandboxResult {
    const blockedCalls: string[] = [];

    // Scan for forbidden imports / requires
    for (const mod of this.forbiddenModules) {
      if (
        code.includes('require("' + mod + '")') ||
        code.includes("require('" + mod + "')") ||
        (code.includes('import') && code.includes(mod))
      ) {
        blockedCalls.push(mod);
      }
    }

    if (code.includes('process.binding') || code.includes('process.exit')) {
      blockedCalls.push('process_tamper');
    }

    if (blockedCalls.length > 0) {
      return {
        success: false,
        blockedCalls,
        error: 'Sandbox security violation: Forbidden modules accessed: ' + blockedCalls.join(', ')
      };
    }

    try {
      const sandboxFn = new Function('context', 'const process = undefined; const require = undefined; return (function() { ' + code + ' })();');
      const result = sandboxFn(context);
      return { success: true, result, blockedCalls: [] };
    } catch (err: any) {
      return { success: false, blockedCalls: [], error: err?.message || String(err) };
    }
  }
}
