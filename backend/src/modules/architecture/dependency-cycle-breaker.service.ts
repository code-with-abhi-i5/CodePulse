export class MicroserviceDependencyCycleBreaker {
  public traceCall(currentService: string, callStackHeader?: string): { allowed: boolean; newCallStack: string; error?: string } {
    const callStack = callStackHeader ? callStackHeader.split('->').map(s => s.trim()) : [];

    if (callStack.includes(currentService)) {
      return {
        allowed: false,
        newCallStack: callStackHeader || '',
        error: `RPC Cycle detected: service '${currentService}' is already in call stack [${callStack.join(' -> ')}]`
      };
    }

    callStack.push(currentService);
    return {
      allowed: true,
      newCallStack: callStack.join('->')
    };
  }
}
