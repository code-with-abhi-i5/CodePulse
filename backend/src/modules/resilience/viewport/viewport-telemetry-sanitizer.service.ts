export class ViewportTelemetrySanitizer {
  scrubAndAttachViewport(payload: Record<string, any>, screenWidth: number, screenHeight: number) {
    const scrubbed = { ...payload };
    delete scrubbed.password;
    delete scrubbed.token;
    delete scrubbed.email;

    return {
      ...scrubbed,
      viewport: {
        width: screenWidth,
        height: screenHeight,
        deviceType: screenWidth < 640 ? 'mobile' : screenWidth < 1024 ? 'tablet' : 'desktop'
      }
    };
  }
}
