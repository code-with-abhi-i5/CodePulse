/** AI Engine Architecture Types */

// --- Batch 6 AI Types ---
export interface PrettierConfigRule {
  singleQuote: boolean;
  semi: boolean;
  tabWidth: number;
  trailingComma: 'none' | 'es5' | 'all';
}

export interface StyleTransferResult {
  formattedCode: string;
  replacementsCount: number;
  compliant: boolean;
}

export interface ToolCallChunk {
  index: number;
  id?: string;
  name?: string;
  argumentFragment: string;
}

export interface ToolCallParseResult {
  isComplete: boolean;
  toolName: string;
  args: Record<string, unknown>;
  rawBuffer: string;
}

export interface AbVariant {
  variantId: string;
  modelName: string;
  systemPrompt: string;
  trafficWeight: number;
}

export interface AbTestEvaluation {
  selectedVariantId: string;
  modelName: string;
  completionPassed: boolean;
  latencyMs: number;
}

export interface SandboxedSolutionResult {
  solutionId: string;
  passedAllTests: boolean;
  testsRun: number;
  testsFailed: number;
  executionOutput: string;
}

export interface PcaReductionResult {
  reducedVector: number[];
  originalDimensions: number;
  reducedDimensions: number;
  varianceRetainedRatio: number;
}

export type TutorState = 'GREETING' | 'ANALYZING_CODE' | 'GIVING_HINT' | 'WAITING_FOR_USER' | 'SUCCESS_CONCLUDED';

export interface TutorTransitionResult {
  previousState: TutorState;
  currentState: TutorState;
  responseMessage: string;
  nextAllowedInputs: string[];
}

export interface SecurityVulnerability {
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  line: number;
  snippet: string;
}

export interface NormalizedAiResponse {
  markdown: string;
  extractedCodeBlocks: Array<{ language: string; code: string }>;
  isProperlyStructured: boolean;
}

export interface HallucinationVerification {
  isHallucinated: boolean;
  hallucinatedExports: string[];
  validExports: string[];
  confidenceScore: number;
}

export interface CodeTranslationResult {
  sourceLanguage: 'python';
  targetLanguage: 'typescript';
  translatedCode: string;
  typeHintsAdded: boolean;
}


// --- Batch 7 AI Types ---
export interface DocstringResult {
  tsDoc: string;
  markdownDoc: string;
  inferredParams: Array<{ name: string; type: string; description: string }>;
  returnType: string;
}

export interface BenchmarkMetrics {
  modelName: string;
  totalTokens: number;
  durationMs: number;
  timeToFirstTokenMs: number;
  tokensPerSecond: number;
  isWithinSlo: boolean;
}

export interface TieredHintResult {
  tier: 1 | 2 | 3;
  hintMessage: string;
  conceptualDirection: string;
  revealsDirectSolution: false;
}

export interface FewShotExample {
  id: string;
  taskType: 'sorting' | 'graph' | 'dp' | 'string' | 'general';
  language: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prompt: string;
  solution: string;
}

export interface FewShotSelectionResult {
  selectedExamples: FewShotExample[];
  retrievalStrategy: string;
  relevanceScore: number;
}

export interface RefactoringSmell {
  ruleId: string;
  severity: 'low' | 'medium' | 'high';
  line: number;
  description: string;
  suggestedFix: string;
}

export interface RefactoringResult {
  smellsDetected: RefactoringSmell[];
  refactoredCode: string;
  optimizationSummary: string;
}

export interface SemanticCacheEntry {
  query: string;
  embedding: number[];
  response: string;
  hitCount: number;
  timestamp: number;
}

export interface SemanticCacheLookupResult {
  isHit: boolean;
  similarity: number;
  cachedResponse?: string;
}

export interface SanitizedPrompt {
  sanitizedText: string;
  strippedTokens: string[];
  injectionAttemptsDetected: number;
}

export interface AlgorithmicBreakdown {
  problemSummary: string;
  divergenceStep: string;
  failedTestAnalysis: {
    input: string;
    expected: string;
    actual: string;
  };
  recommendations: string[];
}

export interface PlagiarismComparison {
  similarityScore: number;
  isFlagged: boolean;
  commonNormalizedTokens: number;
  verdict: 'unique' | 'suspicious' | 'plagiarized';
}

export interface DifficultyCalibration {
  predictedDifficulty: number;
  difficultyTier: 'easy' | 'medium' | 'hard' | 'expert';
  predictedPassRate: number;
  complexityFactors: string[];
}
