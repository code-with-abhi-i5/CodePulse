export interface MicroVmInstance {
  vmId: string;
  socketPath: string;
  memoryMb: number;
  vcpus: number;
  isWarm: boolean;
  bootTimeMs: number;
}

export interface MicroVmFleetMetrics {
  totalWarmVms: number;
  totalVmsSpawned: number;
  totalVmsRecycled: number;
  averageBootDurationMs: number;
}
