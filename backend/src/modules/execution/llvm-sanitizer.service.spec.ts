import { LlvmSanitizerService } from './llvm-sanitizer.service';

describe('LlvmSanitizerService', () => {
  let sanitizer: LlvmSanitizerService;

  beforeEach(() => {
    sanitizer = new LlvmSanitizerService();
  });

  it('should detect AddressSanitizer heap-buffer-overflow', () => {
    const err = '==123==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x602000000014
main.cpp:14:5: runtime error: load of address';
    const report = sanitizer.inspectCompilerOutput(err);

    expect(report.hasMemoryCorruption).toBe(true);
    expect(report.sanitizerType).toBe('ASan');
    expect(report.safeToExecute).toBe(false);
  });

  it('should mark clean compilation as safe to execute', () => {
    const report = sanitizer.inspectCompilerOutput('');
    expect(report.hasMemoryCorruption).toBe(false);
    expect(report.safeToExecute).toBe(true);
  });
});
