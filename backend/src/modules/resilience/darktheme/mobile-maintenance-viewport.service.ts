export class MobileMaintenanceViewportService {
  public getViewportAdjustments(viewportWidth: number): { isMobile: boolean; padding: string; fontSize: string } {
    const isMobile = viewportWidth < 768;
    return {
      isMobile,
      padding: isMobile ? '16px' : '32px',
      fontSize: isMobile ? '18px' : '24px'
    };
  }
}
