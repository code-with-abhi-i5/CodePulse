import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

class PromptVersioningCoordinator {
  constructor() {
    this.prompts = new Map();
  }

  registerPrompt(promptId, version, template, author) {
    const hash = crypto.createHash('sha256').update(template).digest('hex').slice(0, 12);
    const item = {
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
    this.prompts.get(promptId).push(item);
    return item;
  }

  getPrompt(promptId, version) {
    const list = this.prompts.get(promptId);
    if (!list || list.length === 0) return null;
    if (!version) return list[list.length - 1];
    return list.find(p => p.version === version) || null;
  }
}

test('PromptVersioningCoordinator - manages semantic versions of AI tutor prompts', () => {
  const coord = new PromptVersioningCoordinator();
  coord.registerPrompt('tutor-prompt', '1.0.0', 'You are a patient coding tutor.', 'dev-1');
  coord.registerPrompt('tutor-prompt', '1.1.0', 'You are a patient and concise coding tutor.', 'dev-2');

  const v1 = coord.getPrompt('tutor-prompt', '1.0.0');
  assert.strictEqual(v1?.version, '1.0.0');
  assert.ok(v1?.hash.length > 0);

  const latest = coord.getPrompt('tutor-prompt');
  assert.strictEqual(latest?.version, '1.1.0');
});
