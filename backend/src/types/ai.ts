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

export interface OpenApiEndpointSpec {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  requiredHeaders?: string[];
  requiredBodyParams?: string[];
  expectedResponses: number[];
}

export interface SpecComplianceResult {
  isCompliant: boolean;
  missingHeaders: string[];
  missingBodyParams: string[];
  invalidResponses: number[];
  scorePercent: number;
}

export interface RubricScore {
  correctness: number;
  readability: number;
  idiomaticQuality: number;
  performance: number;
  compositeScore: number;
  feedback: string[];
}

export interface ComplexityEstimate {
  estimatedNotation: 'O(1)' | 'O(log N)' | 'O(N)' | 'O(N log N)' | 'O(N^2)' | 'O(2^N)';
  maxNestingDepth: number;
  hasRecursion: boolean;
  reason: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface DialogueSummary {
  compressedContext: string;
  originalMessageCount: number;
  keyConcepts: string[];
  activeMistakes: string[];
}

export interface UserMistakeRecord {
  userId: string;
  category: 'syntax' | 'logic' | 'edge_case' | 'off_by_one' | 'timeout';
  frequency: number;
  lastEncounteredAt: number;
  hintGiven: string;
}

export interface SyntheticTestCase {
  input: string;
  expectedOutput: string;
  category: 'boundary' | 'adversarial' | 'performance';
}

export interface AutocompleteThrottlingDecision {
  shouldCallLlm: boolean;
  wpm: number;
  delayMs: number;
  reason: string;
}

export interface ToxicityAnalysis {
  isToxic: boolean;
  toxicityScore: number;
  sentiment: 'positive' | 'neutral' | 'negative' | 'hostile';
  flaggedKeywords: string[];
}

export interface VersionedPrompt {
  promptId: string;
  version: string;
  template: string;
  hash: string;
  author: string;
  createdAt: number;
}

export interface CodeChunk {
  chunkId: string;
  nodeType: 'class' | 'function' | 'interface' | 'module';
  name: string;
  content: string;
  startLine: number;
  endLine: number;
  tokenCount: number;
}

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
