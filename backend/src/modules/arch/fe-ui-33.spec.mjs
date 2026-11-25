import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InterfaceCodeSnippetGeneratorService } from './fe-ui-33.service.ts';

describe('InterfaceCodeSnippetGeneratorService (FE-UI-33)', () => {
  it('parses TypeScript interface property signatures and generates mock object snippets', () => {
    const generator = new InterfaceCodeSnippetGeneratorService();
    const tsInterface = `
interface UserProfile {
  id: string;
  age: number;
  isActive: boolean;
  tags: string[];
}
`;

    const snippet = generator.generateMockSnippet('UserProfile', tsInterface);
    assert.ok(snippet.includes("const mockUserProfile: UserProfile = {"));
    assert.ok(snippet.includes("id: ''"));
    assert.ok(snippet.includes("age: 0"));
    assert.ok(snippet.includes("isActive: false"));
    assert.ok(snippet.includes("tags: []"));
  });
});
