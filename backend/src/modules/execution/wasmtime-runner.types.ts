export interface WasmModuleProfile {
  moduleHash: string;
  compiledSizeBytes: number;
  maxMemoryBytes: number;
  linearMemoryGuardPages: number;
  compileDurationMs: number;
}
