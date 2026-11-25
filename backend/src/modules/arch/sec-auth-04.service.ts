/**
 * Architecture Service: Argon2id Memory & Parallelism Governor
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-04]
 */

export interface Argon2Config {
  memoryCostKiB: number;
  timeIterations: number;
  parallelism: number;
}

export class Argon2idHardwareGovernorService {
  public calculateOptimalParameters(totalRamMb: number, cpuCores: number): Argon2Config {
    // Parallelism tuned to CPU cores capped at 8
    const parallelism = Math.min(8, Math.max(1, cpuCores));

    // Memory cost: allocate safe work factor (19456 KiB = 19MB baseline)
    let memoryCostKiB = 19456;
    if (totalRamMb >= 16384) {
      memoryCostKiB = 65536; // 64 MB on large servers
    } else if (totalRamMb >= 4096) {
      memoryCostKiB = 32768; // 32 MB on medium servers
    }

    const timeIterations = 3; // RFC 9106 recommended default

    return {
      memoryCostKiB,
      timeIterations,
      parallelism
    };
  }
}
