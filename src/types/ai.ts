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
