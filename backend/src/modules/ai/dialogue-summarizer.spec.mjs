import test from 'node:test';
import assert from 'node:assert/strict';

class DialogueSummarizer {
  summarizeDialogue(messages) {
    const keyConcepts = new Set();
    const activeMistakes = new Set();

    for (const m of messages) {
      const lower = m.content.toLowerCase();
      if (lower.includes('recursion') || lower.includes('recursive')) keyConcepts.add('recursion');
      if (lower.includes('dynamic programming') || lower.includes('dp')) keyConcepts.add('dynamic programming');
      if (lower.includes('off by one')) activeMistakes.add('off-by-one');
    }

    const compressedContext = `Session with ${messages.length} messages. Discussed: [${Array.from(keyConcepts).join(', ')}].`;

    return {
      compressedContext,
      originalMessageCount: messages.length,
      keyConcepts: Array.from(keyConcepts),
      activeMistakes: Array.from(activeMistakes)
    };
  }
}

test('DialogueSummarizer - condenses multi-turn tutor dialogue preserving key concepts', () => {
  const summarizer = new DialogueSummarizer();
  const messages = [
    { role: 'user', content: 'How do I solve this with recursion?', timestamp: Date.now() },
    { role: 'assistant', content: 'Consider the base case first.', timestamp: Date.now() },
    { role: 'user', content: 'I got an off by one error.', timestamp: Date.now() }
  ];

  const summary = summarizer.summarizeDialogue(messages);
  assert.strictEqual(summary.originalMessageCount, 3);
  assert.ok(summary.keyConcepts.includes('recursion'));
  assert.ok(summary.activeMistakes.includes('off-by-one'));
});
