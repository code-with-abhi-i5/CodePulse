export interface CgroupV2Limits {
  memoryMaxBytes: number;
  cpuMaxQuotaUs: number;
  cpuPeriodUs: number;
  pidsMax: number;
}
