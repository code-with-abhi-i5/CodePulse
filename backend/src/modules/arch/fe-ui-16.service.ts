/**
 * Architecture Service: Responsive IDE Layout Constraint Solver
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-16]
 */

export interface IdeLayoutState {
  isMobile: boolean;
  activeTab: 'EDITOR' | 'FILE_TREE' | 'TERMINAL' | 'INSTRUCTIONS';
  paneVisibilities: {
    fileTree: boolean;
    editor: boolean;
    terminal: boolean;
    instructions: boolean;
  };
}

export class ResponsiveIdeLayoutConstraintSolverService {
  private mobileBreakpointPx: number;

  constructor(mobileBreakpointPx: number = 768) {
    this.mobileBreakpointPx = mobileBreakpointPx;
  }

  public solveLayout(viewportWidth: number, selectedTab: 'EDITOR' | 'FILE_TREE' | 'TERMINAL' | 'INSTRUCTIONS' = 'EDITOR'): IdeLayoutState {
    const isMobile = viewportWidth < this.mobileBreakpointPx;

    if (!isMobile) {
      // Desktop: All primary panes visible concurrently
      return {
        isMobile: false,
        activeTab: selectedTab,
        paneVisibilities: {
          fileTree: true,
          editor: true,
          terminal: true,
          instructions: true
        }
      };
    }

    // Mobile: Single active pane rendered full-screen, others folded
    return {
      isMobile: true,
      activeTab: selectedTab,
      paneVisibilities: {
        fileTree: selectedTab === 'FILE_TREE',
        editor: selectedTab === 'EDITOR',
        terminal: selectedTab === 'TERMINAL',
        instructions: selectedTab === 'INSTRUCTIONS'
      }
    };
  }
}
