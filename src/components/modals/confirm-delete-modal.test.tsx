import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ConfirmDeleteModal } from "./confirm-delete-modal";

describe("ConfirmDeleteModal", () => {
  it("renders when open with title, description, and item name", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmDeleteModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        itemName="my-super-repo"
        itemType="repository"
      />
    );

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText('Delete "my-super-repo"')).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to permanently delete/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("calls onClose when Cancel button is clicked", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmDeleteModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        itemName="test-item"
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("closes on Escape key press", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmDeleteModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("calls onConfirm when Delete button is clicked without verification", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <ConfirmDeleteModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    expect(deleteButton).not.toBeDisabled();

    fireEvent.click(deleteButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("enforces verification keyword when requireVerification is true", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <ConfirmDeleteModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        itemName="production-db"
        requireVerification={true}
        verificationKeyword="production-db"
      />
    );

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    expect(deleteButton).toBeDisabled();

    const input = screen.getByPlaceholderText(/type "production-db"/i);
    expect(input).toBeInTheDocument();

    // Type partial/incorrect text
    fireEvent.change(input, { target: { value: "production" } });
    expect(deleteButton).toBeDisabled();

    // Type full keyword
    fireEvent.change(input, { target: { value: "production-db" } });
    expect(deleteButton).not.toBeDisabled();

    fireEvent.click(deleteButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("shows loading state when isLoading is true", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmDeleteModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        isLoading={true}
      />
    );

    expect(screen.getByText(/deleting.../i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
  });

  it("displays error message if onConfirm rejects", async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error("Permission denied."));
    const onClose = vi.fn();

    render(
      <ConfirmDeleteModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Permission denied.");
    });
  });
});

