export class EscapeListenerCoverageVerifier {
  verifyStackOrder(poppedOrder: string[], expectedOrder: string[]): boolean {
    if (poppedOrder.length !== expectedOrder.length) return false;
    for (let i = 0; i < poppedOrder.length; i++) {
      if (poppedOrder[i] !== expectedOrder[i]) return false;
    }
    return true;
  }
}
