import { LspClusterService } from './lsp-cluster.service';

describe('LspClusterService', () => {
  let lsp: LspClusterService;

  beforeEach(() => {
    lsp = new LspClusterService();
  });

  afterEach(() => {
    lsp.onModuleDestroy();
  });

  it('should provision LSP sessions and put idle daemons to sleep', () => {
    const s1 = lsp.getOrCreateSession('sess-1', 'typescript');
    expect(s1.language).toBe('typescript');
    expect(s1.isSleeping).toBe(false);

    // Simulate idle
    s1.lastActiveTimestamp = Date.now() - 70000;
    const reaped = lsp.reapIdleSessions();
    expect(reaped).toBe(1);
    expect(s1.isSleeping).toBe(true);
  });
});
