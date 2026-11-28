import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CodeReviewDrawer, type PullRequestReviewData } from "./code-review-drawer";

describe("CodeReviewDrawer - Strict Focus Trap & Engineering Requirements", () => {
  const onClose = vi.fn();
  const onSubmitReview = vi.fn();
  const onResolveComment = vi.fn();
  const onAddComment = vi.fn();

  const mockReviewData: PullRequestReviewData = {
    prNumber: 501,
    prTitle: "fix(crypto): prevent timing attacks on HMAC signatures",
    repoName: "CodePulse/auth",
    author: "danielle_dev",
    branch: "fix/hmac-timing",
    status: "OPEN",
    additions: 15,
    deletions: 8,
    comments: [
      {
        id: "comm-1",
        filePath: "src/crypto/hmac.ts",
        lineNumber: 42,
        author: { username: "ai-reviewer", name: "CodePulse AI", isAi: true },
        severity: "CRITICAL",
        title: "Constant Time Verification Required",
        content: "Use crypto.timingSafeEqual rather than standard comparison.",
        codeSnippet: {
          before: "return hmacA === hmacB;",
          after: "return crypto.timingSafeEqual(hmacA, hmacB);",
        },
        createdAt: "5m ago",
        resolved: false,
      },
      {
        id: "comm-2",
        filePath: "src/crypto/keys.ts",
        lineNumber: 88,
        author: { username: "senior_dev", name: "Alex" },
        severity: "WARNING",
        title: "Key Rotation Threshold",
        content: "Ensure keys are rotated after 90 days of continuous use.",
        createdAt: "20m ago",
        resolved: false,
      },
      {
        id: "comm-3",
        filePath: "src/crypto/util.ts",
        lineNumber: 10,
        author: { username: "qa_lead", name: "Sarah" },
        severity: "SUGGESTION",
        title: "Export Utility Helper",
        content: "Export helper for unit test reusability.",
        createdAt: "1h ago",
        resolved: true,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with accessible dialog roles, aria-modal, and headings when open", () => {
    render(<CodeReviewDrawer isOpen onClose={onClose} reviewData={mockReviewData} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "code-review-drawer-title");
    expect(dialog).toHaveAttribute("aria-describedby", "code-review-drawer-desc");

    expect(screen.getByText("fix(crypto): prevent timing attacks on HMAC signatures")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close code review drawer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit Review" })).toBeInTheDocument();
  });

  it("renders nothing when isOpen is false", () => {
    render(<CodeReviewDrawer isOpen={false} onClose={onClose} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("strictly traps Tab and Shift+Tab keyboard focus within drawer bounds", async () => {
    const trigger = document.createElement("button");
    trigger.textContent = "Open Review Drawer";
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const { unmount } = render(
      <CodeReviewDrawer isOpen onClose={onClose} reviewData={mockReviewData} />
    );

    const dialog = screen.getByRole("dialog");
    const closeBtn = screen.getByRole("button", { name: "Close code review drawer" });
    const submitBtn = screen.getByRole("button", { name: "Submit Review" });

    // Initial focus lands inside dialog
    await waitFor(() => {
      expect(dialog.contains(document.activeElement)).toBe(true);
    });

    // 1. Focus the last interactive element (Submit Review button)
    submitBtn.focus();
    expect(document.activeElement).toBe(submitBtn);

    // 2. Pressing Tab on the last element wraps focus back to the first element (Close button)
    fireEvent.keyDown(window, { key: "Tab", shiftKey: false });
    expect(document.activeElement).toBe(closeBtn);

    // 3. Pressing Shift + Tab on the first element wraps focus backward to the last element (Submit Review button)
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(submitBtn);

    unmount();
    document.body.removeChild(trigger);
  });

  it("closes drawer on Escape key press and invokes onClose callback", () => {
    render(<CodeReviewDrawer isOpen onClose={onClose} reviewData={mockReviewData} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("restores keyboard focus to the trigger element when drawer is unmounted/closed", async () => {
    const triggerBtn = document.createElement("button");
    triggerBtn.setAttribute("id", "trigger-review-drawer");
    document.body.appendChild(triggerBtn);
    triggerBtn.focus();
    expect(document.activeElement).toBe(triggerBtn);

    const { rerender } = render(
      <CodeReviewDrawer isOpen onClose={onClose} reviewData={mockReviewData} />
    );

    const dialog = screen.getByRole("dialog");
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

    // Close the drawer
    rerender(<CodeReviewDrawer isOpen={false} onClose={onClose} reviewData={mockReviewData} />);

    await waitFor(() => {
      expect(document.activeElement).toBe(triggerBtn);
    });

    document.body.removeChild(triggerBtn);
  });

  it("filters review comments when severity filter tabs are clicked", () => {
    render(<CodeReviewDrawer isOpen onClose={onClose} reviewData={mockReviewData} />);

    // Initially ALL comments are shown
    expect(screen.getByText("Constant Time Verification Required")).toBeInTheDocument();
    expect(screen.getByText("Key Rotation Threshold")).toBeInTheDocument();

    // Click CRITICAL filter
    const criticalTab = screen.getByRole("button", { name: "CRITICAL" });
    fireEvent.click(criticalTab);

    expect(screen.getByText("Constant Time Verification Required")).toBeInTheDocument();
    expect(screen.queryByText("Key Rotation Threshold")).not.toBeInTheDocument();

    // Click RESOLVED filter
    const resolvedTab = screen.getByRole("button", { name: "RESOLVED" });
    fireEvent.click(resolvedTab);

    expect(screen.getByText("Export Utility Helper")).toBeInTheDocument();
    expect(screen.queryByText("Constant Time Verification Required")).not.toBeInTheDocument();
  });

  it("toggles comment resolution state when Resolve button is clicked", () => {
    render(
      <CodeReviewDrawer
        isOpen
        onClose={onClose}
        reviewData={mockReviewData}
        onResolveComment={onResolveComment}
      />
    );

    const resolveButtons = screen.getAllByRole("button", { name: /Resolve/i });
    fireEvent.click(resolveButtons[0]);

    expect(onResolveComment).toHaveBeenCalledWith("comm-1");
  });

  it("allows adding a new review comment via the form", () => {
    render(
      <CodeReviewDrawer
        isOpen
        onClose={onClose}
        reviewData={mockReviewData}
        onAddComment={onAddComment}
      />
    );

    const addCommentBtn = screen.getByRole("button", { name: /Add Comment/i });
    fireEvent.click(addCommentBtn);

    const textarea = screen.getByPlaceholderText(/Explain why this change is necessary/i);
    fireEvent.change(textarea, { target: { value: "New security consideration regarding entropy." } });

    const postBtn = screen.getByRole("button", { name: "Post Note" });
    fireEvent.click(postBtn);

    expect(onAddComment).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "New security consideration regarding entropy.",
      })
    );
    expect(screen.getByText("New security consideration regarding entropy.")).toBeInTheDocument();
  });

  it("submits the selected review verdict (APPROVE, REQUEST_CHANGES, COMMENT)", async () => {
    render(
      <CodeReviewDrawer
        isOpen
        onClose={onClose}
        reviewData={mockReviewData}
        onSubmitReview={onSubmitReview}
      />
    );

    // Select Request Changes
    const reqChangesBtn = screen.getByRole("button", { name: "Request Changes" });
    fireEvent.click(reqChangesBtn);

    // Enter summary comment
    const summaryInput = screen.getByPlaceholderText(/Leave an overall comment/i);
    fireEvent.change(summaryInput, { target: { value: "Please address the timing attack before merge." } });

    const submitBtn = screen.getByRole("button", { name: "Submit Review" });
    fireEvent.click(submitBtn);

    expect(onSubmitReview).toHaveBeenCalledWith("REQUEST_CHANGES", "Please address the timing attack before merge.");
  });
});
