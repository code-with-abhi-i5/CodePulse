/**
 * Architecture Service: User Account Suspicious Activity Alerting Engine
 * Subsystem: Enterprise Authentication & Cryptography [SEC-AUTH-47]
 */

export interface GeoLocation {
  country: string;
  city: string;
  lat: number;
  lon: number;
}

export interface LoginEvent {
  userId: string;
  ip: string;
  location: GeoLocation;
  timestamp: number;
}

export class SuspiciousActivityGeoAlertEngineService {
  private userHistory: Map<string, LoginEvent[]>;
  private maxVelocityKmPerHour: number;

  constructor(maxVelocityKmPerHour: number = 800) {
    this.maxVelocityKmPerHour = maxVelocityKmPerHour;
    this.userHistory = new Map();
  }

  private calculateHaversineDistance(loc1: GeoLocation, loc2: GeoLocation): number {
    const R = 6371; // Earth radius in km
    const dLat = (loc2.lat - loc1.lat) * (Math.PI / 180);
    const dLon = (loc2.lon - loc1.lon) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(loc1.lat * (Math.PI / 180)) * Math.cos(loc2.lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  public evaluateLogin(event: LoginEvent): { isSuspicious: boolean; reason?: string; shouldNotify: boolean } {
    const history = this.userHistory.get(event.userId) || [];

    if (history.length === 0) {
      history.push(event);
      this.userHistory.set(event.userId, history);
      return { isSuspicious: false, shouldNotify: false };
    }

    const lastLogin = history[history.length - 1];
    const distanceKm = this.calculateHaversineDistance(lastLogin.location, event.location);
    const elapsedHours = (event.timestamp - lastLogin.timestamp) / 3600000;

    let isSuspicious = false;
    let reason: string | undefined;

    if (elapsedHours > 0) {
      const velocity = distanceKm / elapsedHours;
      if (velocity > this.maxVelocityKmPerHour && distanceKm > 100) {
        isSuspicious = true;
        reason = `Impossible travel detected: ${Math.round(distanceKm)} km in ${elapsedHours.toFixed(2)}h (${Math.round(velocity)} km/h)`;
      }
    }

    const isNewLocation = lastLogin.location.country !== event.location.country;
    history.push(event);
    this.userHistory.set(event.userId, history);

    return {
      isSuspicious,
      reason,
      shouldNotify: isSuspicious || isNewLocation
    };
  }
}
