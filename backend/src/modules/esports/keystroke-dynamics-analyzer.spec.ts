import { KeystrokeDynamicsAnalyzerService } from './keystroke-dynamics-analyzer.service';

describe('KeystrokeDynamicsAnalyzerService', () => {
  let service: KeystrokeDynamicsAnalyzerService;
  beforeEach(() => { service = new KeystrokeDynamicsAnalyzerService(); });
  it('analyzes empty keystrokes', () => {
    const res = service.analyzeKeystrokes([]);
    expect(res.isMacroInjected).toBe(false);
  });
});
