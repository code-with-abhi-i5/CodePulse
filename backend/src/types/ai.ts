/** AI Engine Architecture Types */

// --- Batch 5 AI Engine Types ---
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
