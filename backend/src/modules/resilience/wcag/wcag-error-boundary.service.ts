export class WcagErrorBoundaryA11y {
  public getErrorContainerProps(): {
    role: string;
    ariaLive: string;
    ariaAtomic: boolean;
  } {
    return {
      role: 'alert',
      ariaLive: 'assertive',
      ariaAtomic: true
    };
  }
}
