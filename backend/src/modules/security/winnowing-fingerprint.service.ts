import { Injectable } from '@nestjs/common';
import { PlagiarismResult } from '../../types/security';

@Injectable()
export class WinnowingFingerprintService {
  generateFingerprints(code: string, kgramSize: number = 5, windowSize: number = 4): number[] {
    const cleaned = code.replace(/\s+/g, '');
    if (cleaned.length < kgramSize) return [];

    const hashes: number[] = [];
    for (let i = 0; i <= cleaned.length - kgramSize; i++) {
      let h = 0;
      for (let j = 0; j < kgramSize; j++) {
        h = (h * 31 + cleaned.charCodeAt(i + j)) | 0;
      }
      hashes.push(h);
    }

    const fingerprints: number[] = [];
    for (let i = 0; i <= hashes.length - windowSize; i++) {
      let minHash = hashes[i];
      for (let j = 1; j < windowSize; j++) {
        if (hashes[i + j] < minHash) {
          minHash = hashes[i + j];
        }
      }
      if (fingerprints.length === 0 || fingerprints[fingerprints.length - 1] !== minHash) {
        fingerprints.push(minHash);
      }
    }
    return fingerprints;
  }

  computeSimilarity(fp1: number[], fp2: number[]): number {
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

  detectPlagiarism(codeA: string, codeB: string, threshold: number = 0.75): PlagiarismResult {
    const fpA = this.generateFingerprints(codeA);
    const fpB = this.generateFingerprints(codeB);
    const similarity = this.computeSimilarity(fpA, fpB);
    return {
      similarity,
      isPlagiarism: similarity >= threshold,
    };
  }
}
