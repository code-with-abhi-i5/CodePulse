import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsOptional,
  IsArray,
  IsBoolean,
} from 'class-validator';

export type SupportedLanguage = 'typescript' | 'javascript' | 'python' | 'go' | 'rust';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  'typescript',
  'javascript',
  'python',
  'go',
  'rust',
];

export class TestCaseDto {
  @ApiProperty({ description: 'Array of input arguments for the function', example: [[2, 7, 11, 15], 9] })
  @IsArray()
  input: any[];

  @ApiProperty({ description: 'Expected return value from the function', example: [0, 1] })
  expected: any;
}

export class TranspileRequestDto {
  @ApiProperty({
    description: 'Source code in the original programming language',
    example: 'function twoSum(nums: number[], target: number): number[] {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) return [map.get(complement), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}',
  })
  @IsString()
  @IsNotEmpty()
  sourceCode: string;

  @ApiProperty({
    description: 'Source programming language',
    enum: ['typescript', 'javascript', 'python', 'go', 'rust'],
    example: 'typescript',
  })
  @IsString()
  @IsIn(SUPPORTED_LANGUAGES)
  sourceLanguage: SupportedLanguage;

  @ApiProperty({
    description: 'Target programming language for idiomatic transpilation',
    enum: ['typescript', 'python', 'go', 'rust'],
    example: 'python',
  })
  @IsString()
  @IsIn(['typescript', 'python', 'go', 'rust'])
  targetLanguage: SupportedLanguage;

  @ApiProperty({ required: false, description: 'Optional entry function name override' })
  @IsOptional()
  @IsString()
  functionName?: string;

  @ApiProperty({ required: false, description: 'Optional challenge ID for caching polyglot templates' })
  @IsOptional()
  @IsString()
  challengeId?: string;

  @ApiProperty({
    required: false,
    type: [TestCaseDto],
    description: 'Optional test cases to verify behavioral output equivalence',
  })
  @IsOptional()
  @IsArray()
  testCases?: TestCaseDto[];
}

export class VerificationResultDto {
  @ApiProperty({ description: 'Whether the transpiled code passed all test verification checks' })
  verified: boolean;

  @ApiProperty({ description: 'Number of test cases passed' })
  passedTests: number;

  @ApiProperty({ description: 'Total number of test cases evaluated' })
  totalTests: number;

  @ApiProperty({ description: 'Execution time of verification in milliseconds' })
  executionTimeMs: number;

  @ApiProperty({ required: false, description: 'Error message if verification failed' })
  error?: string;

  @ApiProperty({ required: false, description: 'Per-test-case verification results' })
  details?: Array<{
    caseIndex: number;
    passed: boolean;
    input: any[];
    expected: any;
    actual: any;
  }>;
}

export class TranspileResponseDto {
  @ApiProperty({ description: 'Idiomatically transpiled source code in target language' })
  transpiledCode: string;

  @ApiProperty({ description: 'Starter boilerplate / stub for competitive coders in target language' })
  starterCode: string;

  @ApiProperty({ description: 'Source language' })
  sourceLanguage: SupportedLanguage;

  @ApiProperty({ description: 'Target language' })
  targetLanguage: SupportedLanguage;

  @ApiProperty({ description: 'Detected / generated entry function signature' })
  functionSignature: string;

  @ApiProperty({ description: 'List of idiomatic conventions and transformations applied' })
  idiomaticTransformations: string[];

  @ApiProperty({ description: 'Behavioral equivalence verification outcome against reference tests' })
  testVerification: VerificationResultDto;

  @ApiProperty({ description: 'Whether the response was loaded from cached polyglot template' })
  cached: boolean;

  @ApiProperty({ required: false, description: 'Challenge template ID if cached in database' })
  templateId?: string;
}

