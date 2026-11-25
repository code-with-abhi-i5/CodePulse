/**
 * Architecture Service: Battle Spectator Split-Screen Layout
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-60]
 */

export type SplitLayoutMode = 'HORIZONTAL' | 'VERTICAL' | 'FOCUS_A' | 'FOCUS_B';

export interface PlayerStreamState {
  playerId: string;
  playerName: string;
  code: string;
  cursorLine: number;
  lastUpdated: number;
}

export class BattleSpectatorSplitScreenService {
  private layoutMode: SplitLayoutMode;
  private playerA: PlayerStreamState;
  private playerB: PlayerStreamState;

  constructor(playerAId: string, playerAName: string, playerBId: string, playerBName: string) {
    this.layoutMode = 'HORIZONTAL';
    this.playerA = {
      playerId: playerAId,
      playerName: playerAName,
      code: '',
      cursorLine: 1,
      lastUpdated: Date.now()
    };
    this.playerB = {
      playerId: playerBId,
      playerName: playerBName,
      code: '',
      cursorLine: 1,
      lastUpdated: Date.now()
    };
  }

  public setLayoutMode(mode: SplitLayoutMode): void {
    this.layoutMode = mode;
  }

  public getLayoutMode(): SplitLayoutMode {
    return this.layoutMode;
  }

  public updatePlayerCode(playerId: string, code: string, cursorLine: number = 1, now: number = Date.now()): boolean {
    if (this.playerA.playerId === playerId) {
      this.playerA.code = code;
      this.playerA.cursorLine = cursorLine;
      this.playerA.lastUpdated = now;
      return true;
    }
    if (this.playerB.playerId === playerId) {
      this.playerB.code = code;
      this.playerB.cursorLine = cursorLine;
      this.playerB.lastUpdated = now;
      return true;
    }
    return false;
  }

  public getPlayerStream(playerId: string): PlayerStreamState | null {
    if (this.playerA.playerId === playerId) return { ...this.playerA };
    if (this.playerB.playerId === playerId) return { ...this.playerB };
    return null;
  }

  public getActiveTyper(): string {
    return this.playerA.lastUpdated >= this.playerB.lastUpdated ? this.playerA.playerId : this.playerB.playerId;
  }
}
