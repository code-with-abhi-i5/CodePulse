export class ViewportRetryGovernor {
  getRetryInterval(attempt: number, isCellular = false) {
    const base = isCellular ? 1500 : 1000;
    const capped = Math.min(attempt, 5);
    const delay = Math.pow(2, capped) * base;
    const jitter = Math.floor(Math.random() * 200);
    return delay + jitter;
  }
}
