export interface PoolHealth {
  active: number;
  max: number;
  utilizationRatio: number;
  status: 'healthy' | 'degraded' | 'critical';
}

export interface RouteQueryResult {
  target: 'primary' | 'replica';
  node: string;
}

export interface XFetchCacheEntry<T = any> {
  value: T;
  needsRecompute: boolean;
}

export interface MigrationValidationResult {
  isRollbackSafe: boolean;
  warnings: string[];
  shadowApplied: boolean;
}

export interface CdcEvent<T = any> {
  eventId: string;
  timestamp: number;
  targetTable: string;
  payload: T;
}

export interface MvccUpdateResult {
  success: boolean;
  newVersion: number;
}
