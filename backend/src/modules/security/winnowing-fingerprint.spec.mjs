import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class WinnowingFingerprintService {
  generateFingerprints(code, kgramSize = 5, windowSize = 4) {
    const cleaned = code.replace(/\s+/g, '');
    if (cleaned.length < kgramSize) return [];
    const hashes = [];
    for (let i = 0; i <= cleaned.length - kgramSize; i++) {
      let h = 0;
      for (let j = 0; j < kgramSize; j++) {
        h = (h * 31 + cleaned.charCodeAt(i + j)) | 0;
      }
      hashes.push(h);
    }
    const fingerprints = [];
    for (let i = 0; i <= hashes.length - windowSize; i++) {
      let minHash = hashes[i];
      for (let j = 1; j < windowSize; j++) {
        if (hashes[i + j] < minHash) minHash = hashes[i + j];
      }
      if (fingerprints.length === 0 || fingerprints[fingerprints.length - 1] !== minHash) {
        fingerprints.push(minHash);
      }
    }
    return fingerprints;
  }

  computeSimilarity(fp1, fp2) {
    if (fp1.length === 0 || fp2.length === 0) return 0;
    const s1 = new Set(fp1);
    const s2 = new Set(fp2);
    let intersection = 0;
    for (const h of s1) {
      if (s2.has(h)) intersection++;
    }
    const union = s1.size + s2.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  detectPlagiarism(codeA, codeB, threshold = 0.75) {
    const fpA = this.generateFingerprints(codeA);
    const fpB = this.generateFingerprints(codeB);
    const similarity = this.computeSimilarity(fpA, fpB);
    return { similarity, isPlagiarism: similarity >= threshold };
  }
}

describe('WinnowingFingerprintService', () => {
  it('computes winnowing fingerprints and accurately detects code plagiarism', () => {
    const service = new WinnowingFingerprintService();
    const c1 = 'function fibonacci(n) { if (n <= 1) return n; return fibonacci(n - 1) + fibonacci(n - 2); }';
    const c2 = 'function fib(n) { if (n <= 1) return n; return fib(n - 1) + fib(n - 2); }';
    const c3 = 'const quickSort = arr => arr.length <= 1 ? arr : [...quickSort(arr.filter(x => x < arr[0]))];';

    const match = service.detectPlagiarism(c1, c1);
    assert.equal(match.similarity, 1.0);
    assert.equal(match.isPlagiarism, true);

    const diff = service.detectPlagiarism(c1, c3);
    assert.equal(diff.isPlagiarism, false);
  });
});
