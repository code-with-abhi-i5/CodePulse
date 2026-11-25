/**
 * Architecture Service: Component Re-Render Frequency Profiler
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-11]
 */

export class ComponentReRenderProfilerService {
  private componentRenders: Map<string, { count: number; lastProps: Record<string, any>; timestamps: number[] }>;
  private burstThreshold: number;

  constructor(burstThreshold: number = 5) {
    this.burstThreshold = burstThreshold;
    this.componentRenders = new Map();
  }

  public recordRender(componentName: string, nextProps: Record<string, any>): { isBurst: boolean; mutatedProps: string[] } {
    const now = Date.now();
    const entry = this.componentRenders.get(componentName) || {
      count: 0,
      lastProps: {},
      timestamps: []
    };

    const mutatedProps: string[] = [];
    if (entry.count > 0) {
      for (const key of Object.keys(nextProps)) {
        if (entry.lastProps[key] !== nextProps[key]) {
          mutatedProps.push(key);
        }
      }
    }

    entry.count++;
    entry.lastProps = { ...nextProps };
    entry.timestamps = entry.timestamps.filter(t => now - t < 1000);
    entry.timestamps.push(now);
    this.componentRenders.set(componentName, entry);

    return {
      isBurst: entry.timestamps.length >= this.burstThreshold,
      mutatedProps
    };
  }
}
