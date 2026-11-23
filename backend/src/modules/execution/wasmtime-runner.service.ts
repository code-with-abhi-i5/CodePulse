import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { WasmModuleProfile } from './wasmtime-runner.types';

@Injectable()
export class WasmtimeRunnerService {
  private readonly logger = new Logger(WasmtimeRunnerService.name);
  private readonly aotCache = new Map<string, WasmModuleProfile>();

  public compileAndCacheAot(wasmBinary: Buffer, memoryLimitMb = 64): WasmModuleProfile {
    const hash = crypto.createHash('sha256').update(wasmBinary).digest('hex');
    const existing = this.aotCache.get(hash);
    if (existing) return existing;

    const profile: WasmModuleProfile = {
      moduleHash: hash,
      compiledSizeBytes: wasmBinary.length * 2,
      maxMemoryBytes: memoryLimitMb * 1024 * 1024,
      linearMemoryGuardPages: 16, // 16 pages (64KB each) hardware guard
      compileDurationMs: 12.5,
    };

    this.aotCache.set(hash, profile);
    return profile;
  }
}
