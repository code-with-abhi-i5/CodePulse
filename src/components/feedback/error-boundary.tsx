"use client";

import React, { Component, type ErrorInfo, type ReactNode, useCallback, useState } from "react";
import { AlertTriangle, RefreshCw, Star } from "lucide-react";

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || "Unexpected rendering error occurred.",
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, errorMessage: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          data-testid="error-boundary-fallback"
          className="flex flex-col gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900 dark:border-red-800 dark:bg-red-950/60 dark:text-red-100 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold sm:text-base">Something went wrong</p>
              <p className="text-xs text-red-700 dark:text-red-300 sm:text-sm">
                {this.state.errorMessage}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-400 bg-white px-3 py-1.5 text-xs font-medium text-red-900 transition hover:bg-red-100 dark:border-red-700 dark:bg-red-900/50 dark:text-red-100 dark:hover:bg-red-900 sm:text-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export interface BookmarkMutationResult {
  bookmarked: boolean;
}

export interface BookmarkToggleMutationProps {
  itemId: string;
  itemLabel?: string;
  initialBookmarked: boolean;
  toggleMutation: (itemId: string, nextBookmarked: boolean) => Promise<BookmarkMutationResult | void>;
  onRollback?: (previousState: boolean, error: Error) => void;
  onSettled?: (finalState: boolean) => void;
}

export const BookmarkToggleMutation: React.FC<BookmarkToggleMutationProps> = ({
  itemId,
  itemLabel = "Bookmark",
  initialBookmarked,
  toggleMutation,
  onRollback,
  onSettled,
}) => {
  const [committedBookmarked, setCommittedBookmarked] = useState<boolean>(initialBookmarked);
  const [displayBookmarked, setDisplayBookmarked] = useState<boolean>(initialBookmarked);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [rollbackError, setRollbackError] = useState<string | null>(null);

  const handleToggle = useCallback(async () => {
    if (isPending) {
      return;
    }

    const previousBookmarked = committedBookmarked;
    const optimisticNext = !previousBookmarked;

    // Optimistic UI update
    setDisplayBookmarked(optimisticNext);
    setRollbackError(null);
    setIsPending(true);

    try {
      const serverResult = await toggleMutation(itemId, optimisticNext);
      const confirmed =
        typeof serverResult?.bookmarked === "boolean"
          ? serverResult.bookmarked
          : optimisticNext;
      setCommittedBookmarked(confirmed);
      setDisplayBookmarked(confirmed);
      onSettled?.(confirmed);
    } catch (err: unknown) {
      const normalizedError =
        err instanceof Error
          ? err
          : new Error("Network error while updating bookmark.");

      // Roll back optimistic star state to last committed state
      setDisplayBookmarked(previousBookmarked);
      setCommittedBookmarked(previousBookmarked);
      setRollbackError(normalizedError.message);
      onRollback?.(previousBookmarked, normalizedError);
      onSettled?.(previousBookmarked);
    } finally {
      setIsPending(false);
    }
  }, [committedBookmarked, isPending, itemId, onRollback, onSettled, toggleMutation]);

  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3 md:gap-4 lg:gap-5">
      <button
        type="button"
        data-testid="bookmark-toggle-button"
        aria-pressed={displayBookmarked}
        aria-busy={isPending}
        disabled={isPending}
        onClick={handleToggle}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-xs transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:w-auto md:px-3.5"
      >
        <Star
          data-testid="bookmark-star-icon"
          data-filled={String(displayBookmarked)}
          aria-hidden="true"
          className={`h-4 w-4 transition-colors ${
            displayBookmarked
              ? "fill-amber-400 text-amber-500 dark:fill-amber-300 dark:text-amber-300"
              : "fill-none text-slate-500 dark:text-slate-400"
          }`}
        />
        <span>{displayBookmarked ? `Bookmarked ${itemLabel}` : `Bookmark ${itemLabel}`}</span>
      </button>

      {rollbackError && (
        <p
          role="status"
          data-testid="bookmark-rollback-notice"
          className="text-xs font-medium text-red-600 dark:text-red-400 sm:text-sm"
        >
          Reverted: {rollbackError}
        </p>
      )}
    </div>
  );
};

export default ErrorBoundary;
