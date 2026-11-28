import { BoundSqlStatement } from '../../types/db';

export class SqlQueryParameterBinderService {
  bindQuery(rawSql: string): BoundSqlStatement {
    const params: any[] = [];
    let counter = 1;

    // Replace literal strings e.g. 'alice'
    let bound = rawSql.replace(/'([^']*)'/g, (match, val) => {
      params.push(val);
      return '$' + counter++;
    });

    // Replace literal numbers outside identifiers
    bound = bound.replace(/\b(\d+)\b/g, (match, val) => {
      params.push(Number(val));
      return '$' + counter++;
    });

    const hashKey = 'stmt:' + Buffer.from(bound).toString('hex').slice(0, 16);

    return {
      parameterizedSql: bound,
      extractedParameters: params,
      hashKey
    };
  }
}
