export type TxState = 'INITIAL' | 'PREPARING' | 'PREPARED' | 'COMMITTING' | 'COMMITTED' | 'ABORTED';

export interface Participant {
  id: string;
  prepare: (txId: string) => Promise<boolean> | boolean;
  commit: (txId: string) => Promise<void> | void;
  abort: (txId: string) => Promise<void> | void;
}

export class TwoPhaseCommitCoordinator {
  private transactions = new Map<string, { state: TxState; participants: Participant[]; timeoutMs: number }>();

  public registerTransaction(txId: string, participants: Participant[], timeoutMs = 2000): void {
    this.transactions.set(txId, {
      state: 'INITIAL',
      participants,
      timeoutMs
    });
  }

  public async executeTransaction(txId: string): Promise<boolean> {
    const tx = this.transactions.get(txId);
    if (!tx) throw new Error(`Transaction ${txId} not found`);

    tx.state = 'PREPARING';

    // Phase 1: Prepare Phase with heuristic timeout
    let allVotedYes = true;
    try {
      const votes = await Promise.all(
        tx.participants.map(p =>
          Promise.race([
            Promise.resolve(p.prepare(txId)),
            new Promise<boolean>((_, reject) =>
              setTimeout(() => reject(new Error('Prepare timeout')), tx.timeoutMs)
            )
          ])
        )
      );
      allVotedYes = votes.every(v => v === true);
    } catch (err) {
      allVotedYes = false;
    }

    // Phase 2: Commit or Abort Phase
    if (allVotedYes) {
      tx.state = 'COMMITTING';
      await Promise.all(tx.participants.map(p => Promise.resolve(p.commit(txId))));
      tx.state = 'COMMITTED';
      return true;
    } else {
      tx.state = 'ABORTED';
      await Promise.all(tx.participants.map(p => Promise.resolve(p.abort(txId))));
      return false;
    }
  }

  public getTransactionState(txId: string): TxState | undefined {
    return this.transactions.get(txId)?.state;
  }
}
