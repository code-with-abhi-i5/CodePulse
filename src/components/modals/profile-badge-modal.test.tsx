import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ProfileBadgeModal } from "./profile-badge-modal";

const mockUser: any = {
  id: "test-user-1",
  username: "nilesh0199",
  name: "Nilesh Thipe",
  avatar: "https://github.com/nilesh0199.png",
  rating: { tier: "Diamond", overall: 92 },
};

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ProfileBadgeModal", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it("renders modal dialog and badge options when open", () => {
    const onClose = vi.fn();
    render(<ProfileBadgeModal isOpen={true} onClose={onClose} user={mockUser} />);

    expect(screen.getByText("GitHub Profile Badge")).toBeInTheDocument();
    expect(screen.getByText("Badge Theme")).toBeInTheDocument();
    expect(screen.getByText("Dark Mode")).toBeInTheDocument();
    expect(screen.getByText("Light Mode")).toBeInTheDocument();
    expect(screen.getByText(/Markdown Code/i)).toBeInTheDocument();
    expect(screen.getByText(/HTML Code/i)).toBeInTheDocument();

    const img = screen.getByRole("img", { name: /nilesh0199's CodePulse developer badge/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", expect.stringContaining("/api/badge/nilesh0199?theme=dark"));
  });

  it("does not render dialog content when closed", () => {
    render(<ProfileBadgeModal isOpen={false} onClose={vi.fn()} user={mockUser} />);
    expect(screen.queryByText("GitHub Profile Badge")).not.toBeInTheDocument();
  });

  it("switches theme and updates badge URL query parameter", () => {
    render(<ProfileBadgeModal isOpen={true} onClose={vi.fn()} user={mockUser} />);

    const lightModeBtn = screen.getByRole("button", { name: /Light Mode/i });
    fireEvent.click(lightModeBtn);

    const img = screen.getByRole("img", { name: /nilesh0199's CodePulse developer badge/i });
    expect(img).toHaveAttribute("src", expect.stringContaining("/api/badge/nilesh0199?theme=light"));
  });

  it("copies markdown snippet to clipboard", async () => {
    render(<ProfileBadgeModal isOpen={true} onClose={vi.fn()} user={mockUser} />);

    const copyMarkdownBtn = screen.getByRole("button", { name: /Copy Markdown/i });
    await act(async () => {
      fireEvent.click(copyMarkdownBtn);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining("[![CodePulse Stats]")
    );
  });

  it("copies HTML snippet to clipboard", async () => {
    render(<ProfileBadgeModal isOpen={true} onClose={vi.fn()} user={mockUser} />);

    const copyHtmlBtn = screen.getByRole("button", { name: /Copy HTML/i });
    await act(async () => {
      fireEvent.click(copyHtmlBtn);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('<a href=')
    );
  });

  it("copies direct image URL to clipboard", async () => {
    render(<ProfileBadgeModal isOpen={true} onClose={vi.fn()} user={mockUser} />);

    const copyUrlBtn = screen.getByRole("button", { name: /Copy Direct Image URL/i });
    await act(async () => {
      fireEvent.click(copyUrlBtn);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining("/api/badge/nilesh0199?theme=dark")
    );
  });

  it("calls onClose when Close button is clicked", () => {
    const onClose = vi.fn();
    render(<ProfileBadgeModal isOpen={true} onClose={onClose} user={mockUser} />);

    const closeBtns = screen.getAllByRole("button", { name: /Close/i });
    fireEvent.click(closeBtns[0]);

    expect(onClose).toHaveBeenCalled();
  });
});
