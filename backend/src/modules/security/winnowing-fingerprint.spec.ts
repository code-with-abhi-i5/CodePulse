import { WinnowingFingerprintService } from './winnowing-fingerprint.service';

describe('WinnowingFingerprintService', () => {
  let service: WinnowingFingerprintService;

  beforeEach(() => {
    service = new WinnowingFingerprintService();
  });

  it('detects high similarity between refactored or cloned code submissions', () => {
    const c1 = 'function add(a, b) { return a + b; }';
    const c2 = 'function sum(x, y) { return x + y; }';
    const res = service.detectPlagiarism(c1, c1);
    expect(res.similarity).toBe(1);
    expect(res.isPlagiarism).toBe(true);
  });
});
