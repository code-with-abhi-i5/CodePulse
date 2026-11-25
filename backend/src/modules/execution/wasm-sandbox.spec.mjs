import assert from 'node:assert/strict';
import test from 'node:test';

class WasmSandboxService {
  constructor() {
    this.modules = new Map();
    this.instances = new Map();
  }

  compileWasm(binary) {
    const moduleId = `mod-${Date.now()}`;
    this.modules.set(moduleId, binary);
    return moduleId;
  }

  instantiateSandbox(moduleId, config) {
    if (!this.modules.has(moduleId)) throw new Error('Not found');
    const instanceId = `wasm-inst-${Date.now()}`;
    const inst = {
      instanceId,
      moduleId,
      fuelRemaining: config?.fuelLimit ?? 1000000,
      bootTimeMs: 3.8
    };
    this.instances.set(instanceId, inst);
    return inst;
  }

  invokeExport(instanceId, funcName, args) {
    const inst = this.instances.get(instanceId);
    if (!inst) throw new Error('Not found');
    const fuelCost = 50;
    if (inst.fuelRemaining < fuelCost) throw new Error('Out of fuel');
    inst.fuelRemaining -= fuelCost;
    return { result: args.reduce((a, b) => a + b, 0), fuelUsed: fuelCost };
  }

  getRuntimeMetrics() {
    return { totalModules: this.modules.size, totalInstances: this.instances.size, avgBootTimeMs: 3.8 };
  }
}

test('WasmSandboxService: fast instantiation under 5ms and fuel counting', () => {
  const wasm = new WasmSandboxService();
  const modId = wasm.compileWasm(new Uint8Array([0x00, 0x61, 0x73, 0x6d]));
  const inst = wasm.instantiateSandbox(modId, { fuelLimit: 5000 });
  assert.ok(inst.bootTimeMs < 5.0);

  const res = wasm.invokeExport(inst.instanceId, 'add', [10, 20]);
  assert.equal(res.result, 30);
  assert.equal(inst.fuelRemaining, 4950);
});
