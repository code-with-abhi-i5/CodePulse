/**
 * Shared AI, LLM Tutor and MCP types for CodePulse
 */

export interface McpToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface AstHintNode {
  level: 1 | 2 | 3;
  category: 'SYNTAX' | 'ALGORITHM' | 'EDGE_CASE';
  guidance: string;
  suggestedLine?: number;
}

export interface TokenUsageBucket {
  userId: string;
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
  promptTokens: number;
  completionTokens: number;
  remainingTokens: number;
}

export interface VectorDocChunk {
  docId: string;
  library: string;
  symbol: string;
  content: string;
  score: number;
}

export interface GuardrailEvaluation {
  isSafe: boolean;
  sanitizedPrompt: string;
  strippedPatterns: string[];
  riskScore: number;
}

export interface DiffExplanation {
  timeComplexity: string;
  spaceComplexity: string;
  markdown: string;
}

export interface SuspiciousLine {
  lineNumber: number;
  score: number; // 0.0 to 1.0 (Tarantula metric)
  failedTestCount: number;
}

export interface StreamingTokenEvent {
  token: string;
  index: number;
  done: boolean;
}

export interface ModelRouteResult {
  modelName: string;
  provider: 'anthropic' | 'openai' | 'local-llama3';
  isFallback: boolean;
  latencyMs: number;
}

export interface GeneratedChallenge {
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  description: string;
  testCases: Array<{ input: string; output: string }>;
}

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


// --- Batch 8 AI Types ---
export interface EdgeCaseTestFixture {
  testName: string;
  inputArguments: any[];
  expectedCondition: string;
}

export interface TruncatedContext {
  optimizedPrompt: string;
  totalTokensEstimate: number;
  omittedSections: string[];
}

export interface ReviewSuggestion {
  id: string;
  category: 'security' | 'bug' | 'performance' | 'style';
  confidenceScore: number;
  line: number;
  message: string;
  rank?: number;
}

export interface RankedReviewSuggestions {
  suggestions: ReviewSuggestion[];
  highestPriorityCategory: string;
}

export interface FallbackRoutingResult {
  routedModel: string;
  isFallback: boolean;
  reason: 'primary_healthy' | 'latency_spike' | 'error_circuit_open';
}

export interface SyntaxPredictionResult {
  hasSyntaxAnomaly: boolean;
  unclosedDelimiters: string[];
  suggestedCompletion: string;
}

export interface TokenQuotaStatus {
  userId: string;
  tier: 'free' | 'pro' | 'enterprise';
  dailyLimit: number;
  tokensUsedToday: number;
  isAllowed: boolean;
}

export interface SemanticSearchResult {
  functionName: string;
  similarityScore: number;
  snippet: string;
}

export interface BackpressureBufferState {
  bufferSizeBytes: number;
  highWaterMarkBytes: number;
  isPaused: boolean;
  droppedTokens: number;
}

export interface CognitiveComplexityResult {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  riskTier: 'low' | 'moderate' | 'high' | 'very_high';
}

export interface FirewallInspectionResult {
  isBlocked: boolean;
  threatLevel: 'none' | 'suspicious' | 'high' | 'critical';
  matchedRules: string[];
  sanitizedPrompt: string;
}
