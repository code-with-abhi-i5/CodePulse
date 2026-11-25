/**
 * Architecture Service: gRPC Client Connection Pool Load Balancer
 * Subsystem: Microservice Transport & Client-Side Load Balancing
 */

export interface GrpcEndpoint {
  address: string;
  healthy: boolean;
}

export class GrpcClientLoadBalancerService {
  private readonly endpoints: GrpcEndpoint[] = [];
  private currentIndex = 0;

  public addEndpoint(address: string, healthy = true): void {
    this.endpoints.push({ address, healthy });
  }

  public setHealth(address: string, healthy: boolean): void {
    const ep = this.endpoints.find(e => e.address === address);
    if (ep) ep.healthy = healthy;
  }

  public getNextEndpoint(): string | null {
    const healthyEndpoints = this.endpoints.filter(e => e.healthy);
    if (healthyEndpoints.length === 0) return null;

    const selected = healthyEndpoints[this.currentIndex % healthyEndpoints.length];
    this.currentIndex = (this.currentIndex + 1) % healthyEndpoints.length;
    return selected.address;
  }
}
