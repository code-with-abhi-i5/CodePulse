/**
 * Architecture Service: Monaco Vim Emulation Mode
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-38]
 */

export type VimMode = 'NORMAL' | 'INSERT' | 'VISUAL' | 'COMMAND';

export class MonacoVimEmulationService {
  private currentMode: VimMode;
  private registers: Map<string, string>;
  private activeMacroRegister: string | null;
  private currentMacroKeys: string[];
  private savedMacros: Map<string, string[]>;

  constructor() {
    this.currentMode = 'NORMAL';
    this.registers = new Map();
    this.activeMacroRegister = null;
    this.currentMacroKeys = [];
    this.savedMacros = new Map();
  }

  public getMode(): VimMode {
    return this.currentMode;
  }

  public setMode(mode: VimMode): void {
    this.currentMode = mode;
  }

  public setRegister(reg: string, value: string): void {
    this.registers.set(reg.toLowerCase(), value);
  }

  public getRegister(reg: string): string {
    return this.registers.get(reg.toLowerCase()) || '';
  }

  public startRecordingMacro(reg: string): void {
    this.activeMacroRegister = reg.toLowerCase();
    this.currentMacroKeys = [];
  }

  public stopRecordingMacro(): string | null {
    if (!this.activeMacroRegister) return null;
    const reg = this.activeMacroRegister;
    this.savedMacros.set(reg, [...this.currentMacroKeys]);
    this.activeMacroRegister = null;
    return reg;
  }

  public handleKeyPress(key: string): void {
    if (this.activeMacroRegister && key !== 'q') {
      this.currentMacroKeys.push(key);
    }

    if (this.currentMode === 'NORMAL') {
      if (key === 'i') {
        this.setMode('INSERT');
      } else if (key === 'v') {
        this.setMode('VISUAL');
      } else if (key === ':') {
        this.setMode('COMMAND');
      }
    } else if (key === 'Escape') {
      this.setMode('NORMAL');
    }
  }

  public replayMacro(reg: string): string[] {
    const keys = this.savedMacros.get(reg.toLowerCase());
    if (!keys) return [];
    for (const k of keys) {
      this.handleKeyPress(k);
    }
    return keys;
  }
}
