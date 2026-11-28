export class GranularErrorBoundaryManager {
  categorizeError(error: Error | { message?: string; name?: string }) {
    const msg = (error?.message || '').toLowerCase();
    if (msg.includes('network') || msg.includes('fetch')) {
      return { type: 'network', recoverable: true, action: 'Retry connection' };
    }
    if (msg.includes('chunk') || msg.includes('loading chunk')) {
      return { type: 'chunk_load', recoverable: true, action: 'Reload page' };
    }
    if (msg.includes('auth') || msg.includes('unauthorized')) {
      return { type: 'authentication', recoverable: false, action: 'Log in again' };
    }
    return { type: 'runtime', recoverable: true, action: 'Try again' };
  }
}
