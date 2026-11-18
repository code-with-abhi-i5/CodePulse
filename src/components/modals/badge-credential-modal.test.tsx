import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BadgeCredentialModal } from "./badge-credential-modal";
import type { Badge } from "@/types";

describe("BadgeCredentialModal", () => {
  const mockBadge: Badge = {
    id: "badge-grandmaster-1",
    name: "Grandmaster Contributor",
    description: "Achieved the highest rank in competitive coding battles",
    icon: "trophy",
    tier: "DIAMOND",
    category: "Competitive",
    createdAt: new Date().toISOString(),
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    badge: mockBadge,
    username: "pro-coder",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders badge credential details and DID information", () => {
    render(<BadgeCredentialModal {...defaultProps} />);

    expect(screen.getByText("Grandmaster Contributor")).toBeInTheDocument();
    expect(screen.getByText("did:web:codepulse.dev")).toBeInTheDocument();
    expect(screen.getByText("did:web:codepulse.dev:users:pro-coder")).toBeInTheDocument();
    expect(screen.getByText("ECDSA P-256 Validated")).toBeInTheDocument();
  });

  it("triggers Add to LinkedIn when button is clicked", () => {
    const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(<BadgeCredentialModal {...defaultProps} />);

    const linkedInBtn = screen.getByRole("button", { name: /Add to LinkedIn/i });
    fireEvent.click(linkedInBtn);

    expect(windowOpenSpy).toHaveBeenCalledWith(
      expect.stringContaining("https://www.linkedin.com/profile/add"),
      "_blank",
      "noopener,noreferrer"
    );
  });

  it("triggers cryptographic credential export download", () => {
    render(<BadgeCredentialModal {...defaultProps} />);

    const exportBtn = screen.getByRole("button", { name: /Export Cryptographic Credential/i });
    expect(exportBtn).toBeInTheDocument();
  });
});
