import test from 'node:test';
import assert from 'node:assert/strict';

class SqlQueryParameterBinderService {
  bindQuery(rawSql) {
    const params = [];
    let counter = 1;
    let bound = rawSql.replace(/'([^']*)'/g, (m, val) => {
      params.push(val);
      return '$' + counter++;
    });
    return { parameterizedSql: bound, extractedParameters: params };
  }
}

test('SqlQueryParameterBinderService - replaces string literals with parameter placeholders', () => {
  const binder = new SqlQueryParameterBinderService();
  const res = binder.bindQuery("SELECT * FROM users WHERE email = 'test@example.com' AND role = 'admin'");
  assert.equal(res.parameterizedSql, 'SELECT * FROM users WHERE email = $1 AND role = $2');
  assert.equal(res.extractedParameters.length, 2);
  assert.equal(res.extractedParameters[0], 'test@example.com');
});
