/**
 * Architecture Service: Blue-Green Ingress Traffic Switcher
 * Subsystem: Advanced DevOps & Infrastructure Automation [DEVOPS-INFRA-25]
 */

export interface TrafficSplit {
  blueWeight: number;
  greenWeight: number;
  activeTarget: 'blue' | 'green' | 'split';
}

export class BlueGreenTrafficSwitcherService {
  private split: TrafficSplit;

  constructor() {
    this.split = {
      blueWeight: 100,
      greenWeight: 0,
      activeTarget: 'blue'
    };
  }

  public shiftTraffic(greenPercentage: number): TrafficSplit {
    const clampedGreen = Math.min(100, Math.max(0, greenPercentage));
    const blue = 100 - clampedGreen;

    this.split = {
      blueWeight: blue,
      greenWeight: clampedGreen,
      activeTarget: clampedGreen === 100 ? 'green' : clampedGreen === 0 ? 'blue' : 'split'
    };
    return this.split;
  }

  public rollbackToBlue(): TrafficSplit {
    this.split = {
      blueWeight: 100,
      greenWeight: 0,
      activeTarget: 'blue'
    };
    return this.split;
  }

  public getSplit(): TrafficSplit {
    return { ...this.split };
  }
}
