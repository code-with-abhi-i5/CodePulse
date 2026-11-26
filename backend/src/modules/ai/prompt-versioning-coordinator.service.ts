import { VersionedPrompt } from '../../types/ai';
import crypto from 'crypto';

export class PromptVersioningCoordinator {
  private prompts: Map<string, VersionedPrompt[]> = new Map();

  registerPrompt(promptId: string, version: string, template: string, author: string): VersionedPrompt {
    const hash = crypto.createHash('sha256').update(template).digest('hex').slice(0, 12);
    const item: VersionedPrompt = {
      promptId,
      version,
      template,
      hash,
      author,
      createdAt: Date.now()
    };

    if (!this.prompts.has(promptId)) {
      this.prompts.set(promptId, []);
    }
    this.prompts.get(promptId)!.push(item);
    return item;
  }

  getPrompt(promptId: string, version?: string): VersionedPrompt | null {
    const list = this.prompts.get(promptId);
    if (!list || list.length === 0) return null;
    if (!version) return list[list.length - 1]; // latest
    return list.find(p => p.version === version) || null;
  }
}
