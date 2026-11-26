export class XtermTerminalEmulatorService_3761 {
  private buffer: string[] = [];
  public write(data: string): void {
    const clean = data.replace(/\x1b\[[0-9;]*m/g, '');
    this.buffer.push(...clean.split('\n'));
  }
  public getLines(): string[] { return [...this.buffer]; }
  public clear(): void { this.buffer = []; }
}