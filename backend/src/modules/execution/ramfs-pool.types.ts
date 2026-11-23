export interface RamfsMountProfile {
  mountId: string;
  tmpfsPath: string;
  sizeBytes: number;
  mountedAt: number;
  wiped: boolean;
}
