import { JsonbOptimizerService } from './jsonb-optimizer.service';

describe('JsonbOptimizerService', () => {
  let service: JsonbOptimizerService;

  beforeEach(() => {
    service = new JsonbOptimizerService();
  });

  it('generates GIN index DDL with path ops for high performance nested lookups', () => {
    const sql = service.generateGinIndexSql('submissions', 'result_payload');
    expect(sql).toContain('USING gin (result_payload jsonb_path_ops)');
  });
});
