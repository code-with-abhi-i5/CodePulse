"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  MessageSquare,
  Check,
  X,
  Filter,
  Send,
  FileCode,
  User,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ReviewVerdict = "APPROVE" | "REQUEST_CHANGES" | "COMMENT";

export type ReviewSeverity = "CRITICAL" | "WARNING" | "SUGGESTION" | "INFO";

export interface ReviewComment {
  readonly id: string;
  readonly filePath: string;
  readonly lineNumber: number;
  readonly author: {
    readonly username: string;
    readonly name?: string;
    readonly avatarUrl?: string;
    readonly isAi?: boolean;
  };
  readonly severity: ReviewSeverity;
  readonly title: string;
  readonly content: string;
  readonly codeSnippet?: {
    readonly before: string;
    readonly after?: string;
    readonly language?: string;
  };
  readonly createdAt: string;
  readonly resolved?: boolean;
}

export interface PullRequestReviewData {
  readonly prNumber: number;
  readonly prTitle: string;
  readonly repoName: string;
  readonly author: string;
  readonly branch: string;
  readonly status: "OPEN" | "MERGED" | "CLOSED";
  readonly additions: number;
  readonly deletions: number;
  readonly comments: ReadonlyArray<ReviewComment>;
}

export interface CodeReviewDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly reviewData?: PullRequestReviewData;
  readonly onSubmitReview?: (verdict: ReviewVerdict, summaryComment: string) => void;
  readonly onResolveComment?: (commentId: string) => void;
  readonly onAddComment?: (comment: {
    filePath: string;
    lineNumber: number;
    content: string;
    severity: ReviewSeverity;
  }) => void;
}

const DEFAULT_REVIEW_DATA: PullRequestReviewData = {
  prNumber: 412,
  prTitle: "feat(auth): add ed25519 cryptographic token signature verification",
  repoName: "CodePulse/core",
  author: "sarah_chen",
  branch: "feature/ed25519-auth",
  status: "OPEN",
  additions: 248,
  deletions: 34,
  comments: [
    {
      id: "rev-1",
      filePath: "src/auth/jwt-verifier.ts",
      lineNumber: 48,
      author: {
        username: "codepulse-sentinel",
        name: "CodePulse Sentinel AI",
        isAi: true,
      },
      severity: "CRITICAL",
      title: "Potential Timing Attack Vulnerability",
      content:
        "The signature comparison uses standard equality check `===` which leaks timing information. Use `crypto.timingSafeEqual` to prevent side-channel timing attacks.",
      codeSnippet: {
        before: "return signatureBuffer.toString() === expectedSignature.toString();",
        after: "return crypto.timingSafeEqual(signatureBuffer, expectedSignature);",
        language: "typescript",
      },
      createdAt: "10m ago",
      resolved: false,
    },
    {
      id: "rev-2",
      filePath: "src/auth/public-key-cache.ts",
      lineNumber: 112,
      author: {
        username: "marcus_lead",
        name: "Marcus Vance",
        isAi: false,
      },
      severity: "WARNING",
      title: "Missing Cache Eviction Policy",
      content:
        "Public keys are cached in memory indefinitely without TTL or LRU capacity limit, potentially causing memory leaks under high rotation.",
      createdAt: "25m ago",
      resolved: false,
    },
    {
      id: "rev-3",
      filePath: "src/auth/token-parser.ts",
      lineNumber: 24,
      author: {
        username: "codepulse-sentinel",
        name: "CodePulse Sentinel AI",
        isAi: true,
      },
      severity: "SUGGESTION",
      title: "Early Exit Optimization",
      content:
        "Check for standard Bearer prefix length before allocating split string array to avoid unnecessary garbage collection overhead in hot path.",
      createdAt: "1h ago",
      resolved: true,
    },
  ],
};

const FOCUSABLE_SELECTOR =
  'button:not([disabled]):not([aria-hidden="true"]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function CodeReviewDrawer({
  isOpen,
  onClose,
  reviewData = DEFAULT_REVIEW_DATA,
  onSubmitReview,
  onResolveComment,
  onAddComment,
}: CodeReviewDrawerProps) {
  const [filterSeverity, setFilterSeverity] = useState<"ALL" | ReviewSeverity | "RESOLVED">("ALL");
  const [comments, setComments] = useState<ReviewComment[]>([...reviewData.comments]);
  const [verdict, setVerdict] = useState<ReviewVerdict>("APPROVE");
  const [summaryComment, setSummaryComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isAddingComment, setIsAddingComment] = useState<boolean>(false);
  const [newFilePath, setNewFilePath] = useState<string>("src/auth/jwt-verifier.ts");
  const [newLineNumber, setNewLineNumber] = useState<number>(50);
  const [newContent, setNewContent] = useState<string>("");
  const [newSeverity, setNewSeverity] = useState<ReviewSeverity>("WARNING");

  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Sync incoming review data comments
  useEffect(() => {
    setComments([...reviewData.comments]);
  }, [reviewData.comments]);

  // Handle comment resolution toggle
  const handleToggleResolve = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, resolved: !c.resolved } : c))
    );
    if (onResolveComment) {
      onResolveComment(commentId);
    }
  };

  // Handle new comment submission
  const handleCreateComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const newComment: ReviewComment = {
      id: `rev-${Date.now()}`,
      filePath: newFilePath,
      lineNumber: newLineNumber,
      author: {
        username: "current_user",
        name: "You",
        isAi: false,
      },
      severity: newSeverity,
      title: `Review note on line ${newLineNumber}`,
      content: newContent.trim(),
      createdAt: "Just now",
      resolved: false,
    };

    setComments((prev) => [newComment, ...prev]);
    if (onAddComment) {
      onAddComment({
        filePath: newFilePath,
        lineNumber: newLineNumber,
        content: newContent.trim(),
        severity: newSeverity,
      });
    }

    setNewContent("");
    setIsAddingComment(false);
  };

  // Handle review verdict submission
  const handleSubmitVerdict = () => {
    setIsSubmitting(true);
    if (onSubmitReview) {
      onSubmitReview(verdict, summaryComment);
    }
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 300);
  };

  // Filtered comments
  const filteredComments = comments.filter((c) => {
    if (filterSeverity === "ALL") return true;
    if (filterSeverity === "RESOLVED") return !!c.resolved;
    return c.severity === filterSeverity && !c.resolved;
  });

  const unresolvedCount = comments.filter((c) => !c.resolved).length;
  const criticalCount = comments.filter((c) => c.severity === "CRITICAL" && !c.resolved).length;

  // ==========================================================================
  // Strict Keyboard Focus Trap Engine
  // ==========================================================================
  useEffect(() => {
    if (!isOpen) return;

    // 1. Capture previously active element to restore focus on close
    if (typeof document !== "undefined") {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    }

    // 2. Initial focus: move focus to first interactive element inside drawer
    const focusInitial = () => {
      if (!drawerRef.current) return;
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        drawerRef.current.focus();
      }
    };

    const animFrame = requestAnimationFrame(focusInitial);

    // 3. Strict Tab / Shift+Tab and Escape Key Listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        if (!drawerRef.current) return;

        const focusable = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true");

        if (focusable.length === 0) {
          e.preventDefault();
          drawerRef.current.focus();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (e.shiftKey) {
          // Shift + Tab: reverse cycle
          if (active === first || !drawerRef.current.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          // Tab: forward cycle
          if (active === last || !drawerRef.current.contains(active)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("keydown", handleKeyDown, true);

      // 4. Restore focus upon drawer dismissal
      if (
        previousActiveElementRef.current &&
        typeof previousActiveElementRef.current.focus === "function"
      ) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sliding Drawer Container */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="code-review-drawer-title"
        aria-describedby="code-review-drawer-desc"
        tabIndex={-1}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex flex-col w-full",
          // Responsive breakpoints: full width on mobile, scaled width on tablet/desktop
          "sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl",
          "shadow-2xl border-l outline-none transition-all duration-200 animate-in slide-in-from-right",
          // Light & Dark theme compatibility
          "bg-white dark:bg-slate-950",
          "border-slate-200 dark:border-white/10",
          "text-slate-900 dark:text-slate-50"
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-slate-100 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                  {reviewData.repoName}#{reviewData.prNumber}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-2 py-0.5 font-bold uppercase",
                    criticalCount > 0
                      ? "text-rose-500 border-rose-500/30 bg-rose-500/10"
                      : "text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
                  )}
                >
                  {criticalCount > 0 ? `${criticalCount} Critical Issues` : "Ready for Review"}
                </Badge>
              </div>
              <h2
                id="code-review-drawer-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white line-clamp-1 mt-0.5"
              >
                {reviewData.prTitle}
              </h2>
              <p
                id="code-review-drawer-desc"
                className="text-xs text-slate-500 dark:text-slate-400 mt-0.5"
              >
                Author: <span className="font-semibold">{reviewData.author}</span> • Branch:{" "}
                <span className="font-mono">{reviewData.branch}</span> •{" "}
                <span className="text-emerald-500">+{reviewData.additions}</span>{" "}
                <span className="text-rose-500">-{reviewData.deletions}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close code review drawer"
            className={cn(
              "p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
              "hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
            )}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Severity Filter Tabs */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-slate-100 dark:border-white/[0.06] bg-slate-100/50 dark:bg-white/[0.01] flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            {(["ALL", "CRITICAL", "WARNING", "SUGGESTION", "RESOLVED"] as const).map((sev) => {
              const isActive = filterSeverity === sev;
              return (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setFilterSeverity(sev)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/[0.06]"
                  )}
                >
                  {sev}
                </button>
              );
            })}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsAddingComment(!isAddingComment)}
            className="text-xs h-7 gap-1 font-semibold text-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Comment</span>
          </Button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Add New Comment Form (Collapsible) */}
          {isAddingComment && (
            <form
              onSubmit={handleCreateComment}
              className="p-4 rounded-2xl border bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.1] space-y-3 animate-in fade-in zoom-in-95"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                <span>Add Review Comment</span>
                <button
                  type="button"
                  onClick={() => setIsAddingComment(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label htmlFor="comment-filepath" className="block text-slate-500 mb-1">
                    File Path
                  </label>
                  <input
                    id="comment-filepath"
                    type="text"
                    value={newFilePath}
                    onChange={(e) => setNewFilePath(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-xs focus-visible:ring-2 focus-visible:ring-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="comment-line" className="block text-slate-500 mb-1">
                    Line Number
                  </label>
                  <input
                    id="comment-line"
                    type="number"
                    value={newLineNumber}
                    onChange={(e) => setNewLineNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-2.5 py-1.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-xs focus-visible:ring-2 focus-visible:ring-primary outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="comment-content" className="block text-xs text-slate-500 mb-1">
                  Comment Details
                </label>
                <textarea
                  id="comment-content"
                  rows={2}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Explain why this change is necessary..."
                  className="w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-xs focus-visible:ring-2 focus-visible:ring-primary outline-none resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  {(["CRITICAL", "WARNING", "SUGGESTION"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewSeverity(s)}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                        newSeverity === s
                          ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <Button type="submit" size="sm" className="h-7 text-xs font-bold">
                  Post Note
                </Button>
              </div>
            </form>
          )}

          {/* Comments List */}
          {filteredComments.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                No Review Comments Found
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All comments in this category have been resolved or filtered out.
              </p>
            </div>
          ) : (
            filteredComments.map((comment) => (
              <div
                key={comment.id}
                className={cn(
                  "p-4 rounded-2xl border transition-all space-y-3",
                  comment.resolved
                    ? "opacity-60 bg-slate-50 dark:bg-white/[0.01] border-slate-200 dark:border-white/[0.05]"
                    : "bg-white dark:bg-slate-900/40 border-slate-200 dark:border-white/10 shadow-xs"
                )}
              >
                {/* Comment Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border",
                        comment.severity === "CRITICAL" &&
                          "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
                        comment.severity === "WARNING" &&
                          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                        comment.severity === "SUGGESTION" &&
                          "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
                        comment.severity === "INFO" &&
                          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      )}
                    >
                      {comment.severity}
                    </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {comment.filePath}:{comment.lineNumber}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleResolve(comment.id)}
                    className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      comment.resolved
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                    )}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{comment.resolved ? "Resolved" : "Resolve"}</span>
                  </button>
                </div>

                {/* Title & Author */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {comment.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {comment.author.isAi ? (
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                    <span>{comment.author.name || comment.author.username}</span>
                    <span>•</span>
                    <span>{comment.createdAt}</span>
                  </div>
                </div>

                {/* Content */}
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {comment.content}
                </p>

                {/* Code Snippet Box */}
                {comment.codeSnippet && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 font-mono text-xs">
                    <div className="bg-rose-50 dark:bg-rose-950/20 px-3 py-1.5 text-rose-700 dark:text-rose-400 border-b border-slate-200 dark:border-white/10">
                      - {comment.codeSnippet.before}
                    </div>
                    {comment.codeSnippet.after && (
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 text-emerald-700 dark:text-emerald-400">
                        + {comment.codeSnippet.after}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer: Review Decision & Submission */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="review-summary-notes"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Review Verdict & Summary
            </label>
            <textarea
              id="review-summary-notes"
              rows={2}
              value={summaryComment}
              onChange={(e) => setSummaryComment(e.target.value)}
              placeholder="Leave an overall comment regarding the architectural changes..."
              className={cn(
                "w-full px-3 py-2 rounded-xl border text-xs outline-none resize-none transition-all",
                "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10",
                "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
              )}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Verdict Selection Pills */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              {(["APPROVE", "REQUEST_CHANGES", "COMMENT"] as const).map((v) => {
                const isSelected = verdict === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVerdict(v)}
                    className={cn(
                      "flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      isSelected
                        ? v === "APPROVE"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : v === "REQUEST_CHANGES"
                          ? "bg-rose-600 text-white shadow-sm"
                          : "bg-slate-800 text-white dark:bg-white dark:text-slate-950 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/[0.06]"
                    )}
                  >
                    {v === "APPROVE" && "Approve"}
                    {v === "REQUEST_CHANGES" && "Request Changes"}
                    {v === "COMMENT" && "Comment"}
                  </button>
                );
              })}
            </div>

            {/* Final Action Button */}
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitVerdict}
              className={cn(
                "w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-white transition-all",
                verdict === "APPROVE" && "bg-emerald-600 hover:bg-emerald-500",
                verdict === "REQUEST_CHANGES" && "bg-rose-600 hover:bg-rose-500",
                verdict === "COMMENT" && "bg-primary hover:bg-primary/90",
                "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
              )}
            >
              Submit Review
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
