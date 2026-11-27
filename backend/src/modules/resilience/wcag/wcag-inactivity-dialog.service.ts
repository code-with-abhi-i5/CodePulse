export class WcagInactivityDialogA11y {
  public getDialogAriaProps(): {
    role: string;
    ariaModal: boolean;
    ariaLabelledBy: string;
    ariaDescribedBy: string;
  } {
    return {
      role: 'alertdialog',
      ariaModal: true,
      ariaLabelledBy: 'inactivity-dialog-title',
      ariaDescribedBy: 'inactivity-dialog-description'
    };
  }

  public getCountdownAnnouncement(secondsLeft: number): string {
    const minutes = Math.floor(secondsLeft / 60);
    return `Warning: Your session will expire in ${minutes} minutes due to inactivity. Press Extend Session to remain logged in.`;
  }
}
