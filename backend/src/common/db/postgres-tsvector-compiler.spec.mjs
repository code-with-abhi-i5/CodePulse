import test from 'node:test';
import assert from 'node:assert/strict';

class PostgresTsvectorCompilerService {
  compileVector(titleCol, descCol, tagsCol, lang = 'english') {
    return {
      language: lang,
      generatedExpression: "setweight(to_tsvector('" + lang + "', coalesce(" + titleCol + ", '')), 'A') || setweight(to_tsvector('" + lang + "', coalesce(" + descCol + ", '')), 'B')",
      queryExpression: "plainto_tsquery('" + lang + "', :query)"
    };
  }
}

test('PostgresTsvectorCompilerService - compiles weighted tsvector expressions', () => {
  const compiler = new PostgresTsvectorCompilerService();
  const comp = compiler.compileVector('title', 'description', 'tags', 'english');

  assert.ok(comp.generatedExpression.includes("'A'"));
  assert.ok(comp.generatedExpression.includes("'B'"));
  assert.equal(comp.language, 'english');
});
