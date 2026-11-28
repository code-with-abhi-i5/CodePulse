export class WcagRepoDeletionDialog {
  getAriaDialogAttributes(repoName: string) {
    return {
      role: 'alertdialog',
      'aria-modal': 'true',
      'aria-labelledby': 'delete-dialog-title',
      'aria-describedby': 'delete-dialog-desc',
      confirmLabel: `Type ${repoName} to confirm permanent deletion`
    };
  }
}
