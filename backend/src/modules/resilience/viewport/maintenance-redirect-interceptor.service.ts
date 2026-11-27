export class MaintenanceRedirectInterceptor {
  shouldRedirect(statusCode: number, endpoint: string) {
    if (statusCode === 503) {
      if (endpoint === '/api/health' || endpoint === '/maintenance') {
        return false;
      }
      return true;
    }
    return false;
  }

  getRedirectUrl() {
    return '/maintenance';
  }
}
