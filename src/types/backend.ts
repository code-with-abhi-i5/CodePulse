/**
 * Shared backend types for CodePulse Sandboxed Execution Subsystem
 */

export interface MicroVmOptions {
  vmId: string;
  socketPath: string;
  memoryMb: number;
  vcpus: number;
  isWarm: boolean;
  bootTimeMs: number;
}

export interface CgroupLimits {
  memoryMaxBytes: number;
  cpuMaxPercent: number;
  pidsMax: number;
}

export interface ExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  memoryUsageBytes: number;
}

export interface SecurityViolationEvent {
  violationId: string;
  pid: number;
  syscallName: string;
  timestamp: string;
  actionTaken: 'KILL' | 'LOG' | 'TRAP';
}

export interface WasmConfig {
  fuelLimit: number;
  memoryPages: number;
  allowWasi: boolean;
}

export interface StreamChunk {
  stream: 'stdout' | 'stderr';
  data: string;
  timestamp: number;
}

export interface TerminationReport {
  processId: string;
  rootPid: number;
  terminatedPids: number[];
  reason: 'WALL_CLOCK_TIMEOUT' | 'CPU_DEADLINE_EXCEEDED' | 'OOM_KILL';
  timestamp: string;
}

export interface OomEvent {
  id: string;
  pid: number;
  cgroup: string;
  memoryRequested: number;
  memoryLimit: number;
  timestamp: string;
}

export interface LanguageProfile {
  id: string;
  name: string;
  compiler: string;
  sourceFile: string;
  binaryFile: string;
  timeoutMs: number;
}

export interface SecurityScanFinding {
  ruleId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  line: number;
}
