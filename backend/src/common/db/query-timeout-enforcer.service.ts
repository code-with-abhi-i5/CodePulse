import { QueryTimeoutConfig } from '../../types/db';

export class QueryTimeoutEnforcerService {
  private readonly defaultTimeouts: Record<string, number> = {
    'oltp': 2000,
    'analytics': 15000,
    'maintenance': 60000
  };

  resolveTimeoutConfig(queryType: 'oltp' | 'analytics' | 'maintenance', overrideMs?: number): QueryTimeoutConfig {
    const timeout = overrideMs || this.defaultTimeouts[queryType] || 5000;
    return {
      queryType,
      statementTimeoutMs: timeout,
      enforceDynamicTimeout: true
    };
  }

  generateTimeoutPrefix(config: QueryTimeoutConfig): string {
    return 'SET LOCAL statement_timeout = ' + config.statementTimeoutMs + ';';
  }
}
