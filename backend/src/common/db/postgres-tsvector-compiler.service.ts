import { TsvectorCompilation } from '../../types/db';

export class PostgresTsvectorCompilerService {
  compileVector(titleCol: string, descCol: string, tagsCol: string, lang: string = 'english'): TsvectorCompilation {
    const generatedExpression =
      'setweight(to_tsvector(\'' + lang + '\', coalesce(' + titleCol + ', \'\')), \'A\') || ' +
      'setweight(to_tsvector(\'' + lang + '\', coalesce(' + descCol + ', \'\')), \'B\') || ' +
      'setweight(to_tsvector(\'' + lang + '\', coalesce(' + tagsCol + ', \'\')), \'C\')';

    const queryExpression = 'plainto_tsquery(\'' + lang + '\', :searchQuery)';

    return {
      language: lang,
      generatedExpression,
      queryExpression
    };
  }
}
