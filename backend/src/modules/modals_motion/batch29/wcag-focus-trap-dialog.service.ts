export class WcagFocusTrapDialog {
  getAccessibleDialogAttrs(dialogId: string, titleId: string) {
    return {
      id: dialogId,
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': titleId,
      tabIndex: -1
    };
  }
}
