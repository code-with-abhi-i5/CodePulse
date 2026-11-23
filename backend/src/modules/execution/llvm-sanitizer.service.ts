import { Injectable, Logger } from '@nestjs/common';
import { SanitizerReport } from './llvm-sanitizer.types';

@Injectable()
export class LlvmSanitizerService {
  private readonly logger = new Logger(LlvmSanitizerService.name);

  public inspectCompilerOutput(stderr: string): SanitizerReport {
    if (stderr.includes('AddressSanitizer: heap-buffer-overflow') || stderr.includes('AddressSanitizer: heap-use-after-free')) {
      const lineMatch = stderr.match(/:(d+):d+: runtime error/);
      return {
        hasMemoryCorruption: true,
        sanitizerType: 'ASan',
        errorMessage: 'AddressSanitizer detected memory corruption (heap-buffer-overflow / use-after-free).',
        lineNumber: lineMatch ? parseInt(lineMatch[1], 10) : undefined,
        safeToExecute: false,
      };
    }

    if (stderr.includes('UndefinedBehaviorSanitizer')) {
      return {
        hasMemoryCorruption: true,
        sanitizerType: 'UBSan',
        errorMessage: 'UndefinedBehaviorSanitizer flagged undefined behavior (integer overflow / null dereference).',
        safeToExecute: false,
      };
    }

    return {
      hasMemoryCorruption: false,
      safeToExecute: true,
    };
  }
}
