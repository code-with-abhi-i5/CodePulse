import { WasmtimeRunnerService } from './wasmtime-runner.service';

describe('WasmtimeRunnerService', () => {
  let service: WasmtimeRunnerService;

  beforeEach(() => {
    service = new WasmtimeRunnerService();
  });

  it('should compile and cache AOT Wasm module with linear memory guard pages', () => {
    const mockWasm = Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
    const profile = service.compileAndCacheAot(mockWasm, 32);

    expect(profile.moduleHash).toBeDefined();
    expect(profile.linearMemoryGuardPages).toBe(16);
    expect(profile.maxMemoryBytes).toBe(32 * 1024 * 1024);
  });
});
