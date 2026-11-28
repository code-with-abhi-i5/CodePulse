export class DeletionCoverageVerifier {
  verifyMatch(expected: string, actual: string): boolean {
    if (!expected || !actual) return false;
    return expected.trim() === actual.trim();
  }
}
