export interface SanitizerReport {
  hasMemoryCorruption: boolean;
  sanitizerType?: 'ASan' | 'UBSan' | 'TSan';
  errorMessage?: string;
  lineNumber?: number;
  safeToExecute: boolean;
}
