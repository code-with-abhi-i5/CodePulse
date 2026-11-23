export type LspLanguage = 'typescript' | 'python' | 'cpp' | 'rust' | 'go';

export interface LspSession {
  sessionId: string;
  language: LspLanguage;
  isSleeping: boolean;
  lastActiveTimestamp: number;
}
