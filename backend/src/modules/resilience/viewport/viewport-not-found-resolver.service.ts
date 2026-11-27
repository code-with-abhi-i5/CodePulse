export class ViewportNotFoundResolver {
  getAdaptiveLinkLayout(screenWidth: number) {
    const isSmall = screenWidth < 768;
    return {
      columns: isSmall ? 1 : 2,
      displayMode: isSmall ? 'stack' : 'grid',
      gap: isSmall ? '8px' : '16px',
      maxSuggestedItems: isSmall ? 3 : 6
    };
  }
}
