export class DarkRepoDeletionModal {
  getInputTheme(hasError: boolean) {
    return {
      backgroundColor: '#111827',
      textColor: '#ffffff',
      borderColor: hasError ? '#ef4444' : '#4b5563',
      outlineColor: hasError ? '#f87171' : '#60a5fa'
    };
  }
}
