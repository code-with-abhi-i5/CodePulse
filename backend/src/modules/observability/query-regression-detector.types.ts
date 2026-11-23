export interface QueryStatSample {
  queryId: string;
  fingerprint: string;
  meanExecTimeMs: number;
  totalCalls: number;
  bufferHits: number;
  bufferMisses: number;
}

export interface PlanRegressionAlert {
  queryId: string;
  fingerprint: string;
  baselineTimeMs: number;
  observedTimeMs: number;
  regressionRatio: number;
  detectedAt: number;
}
