import { ChatMessage, DialogueSummary } from '../../types/ai';

export class DialogueSummarizer {
  summarizeDialogue(messages: ChatMessage[]): DialogueSummary {
    const keyConcepts = new Set<string>();
    const activeMistakes = new Set<string>();

    for (const m of messages) {
      const lower = m.content.toLowerCase();
      if (lower.includes('recursion') || lower.includes('recursive')) keyConcepts.add('recursion');
      if (lower.includes('dynamic programming') || lower.includes('dp')) keyConcepts.add('dynamic programming');
      if (lower.includes('binary search')) keyConcepts.add('binary search');
      if (lower.includes('off by one') || lower.includes('index out of bounds')) activeMistakes.add('off-by-one');
      if (lower.includes('null pointer') || lower.includes('undefined')) activeMistakes.add('null-dereference');
    }

    const compressedContext = `Session with ${messages.length} messages. Discussed: [${Array.from(keyConcepts).join(', ')}]. Active issues: [${Array.from(activeMistakes).join(', ')}].`;

    return {
      compressedContext,
      originalMessageCount: messages.length,
      keyConcepts: Array.from(keyConcepts),
      activeMistakes: Array.from(activeMistakes)
    };
  }
}
