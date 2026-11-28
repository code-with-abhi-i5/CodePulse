"use client";

import * as React from "react";
import { AlertTriangle, Trash2, Loader2, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ConfirmDeleteModalProps {
  /** Whether the modal is open (accepts isOpen or open) */
  isOpen?: boolean;
  open?: boolean;
  /** Callback triggered when modal requests to close */
  onClose?: () => void;
  /** Dialog open state change handler */
  onOpenChange?: (open: boolean) => void;
  /** Action executed when the delete confirmation is triggered */
  onConfirm: () => void | Promise<void>;
  /** Custom modal title, defaults to "Delete {itemType}" or "Delete Item" */
  title?: string;
  /** Explanatory description */
  description?: React.ReactNode;
  /** Name of the entity being deleted (e.g. repo name, challenge title) */
  itemName?: string;
  /** Entity noun (e.g. "repository", "challenge", "session", "item") */
  itemType?: string;
  /** Confirm action button text, default "Delete" */
  confirmText?: string;
  /** Cancel button text, default "Cancel" */
  cancelText?: string;
  /** Whether this action is destructive, default true */
  isDestructive?: boolean;
  /** External loading state */
  isLoading?: boolean;
  /** Require typing confirmation keyword before enabling delete button */
  requireVerification?: boolean;
  /** Keyword to type when verification is required. Defaults to itemName or "DELETE" */
  verificationKeyword?: string;
  /** Custom placeholder for verification input */
  verificationPlaceholder?: string;
  /** Additional styling classes for the dialog popup */
  className?: string;
}

export function ConfirmDeleteModal({
  isOpen,
  open,
  onClose,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemName,
  itemType = "item",
  confirmText = "Delete",
  cancelText = "Cancel",
  isDestructive = true,
  isLoading = false,
  requireVerification = false,
  verificationKeyword,
  verificationPlaceholder,
  className,
}: ConfirmDeleteModalProps) {
  const isModalOpen = open ?? isOpen ?? false;

  const [verificationInput, setVerificationInput] = React.useState("");
  const [internalSubmitting, setInternalSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const cancelButtonRef = React.useRef<HTMLButtonElement | null>(null);

  const targetKeyword = React.useMemo(() => {
    if (verificationKeyword) return verificationKeyword;
    if (itemName) return itemName;
    return "DELETE";
  }, [verificationKeyword, itemName]);

  const isVerificationSatisfied = React.useMemo(() => {
    if (!requireVerification) return true;
    return (
      verificationInput.trim().toLowerCase() ===
      targetKeyword.trim().toLowerCase()
    );
  }, [requireVerification, verificationInput, targetKeyword]);

  const isPending = isLoading || internalSubmitting;

  const handleClose = React.useCallback(() => {
    if (isPending) return;
    onClose?.();
    onOpenChange?.(false);
  }, [isPending, onClose, onOpenChange]);

  // Reset internal state whenever modal opens or closes
  React.useEffect(() => {
    if (isModalOpen) {
      setVerificationInput("");
      setErrorMessage(null);
      setInternalSubmitting(false);
    }
  }, [isModalOpen]);

  // Strict Escape key listener across all custom open states
  React.useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) {
        event.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen, isPending, handleClose]);

  const handleConfirmAction = async () => {
    if (!isVerificationSatisfied || isPending) return;

    setErrorMessage(null);
    setInternalSubmitting(true);

    try {
      await onConfirm();
      handleClose();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while deleting.";
      setErrorMessage(message);
    } finally {
      setInternalSubmitting(false);
    }
  };

  const computedTitle =
    title || (itemName ? `Delete "${itemName}"` : `Delete ${itemType}`);

  return (
    <Dialog
      open={isModalOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose();
      }}
    >
      <DialogContent
        data-slot="confirm-delete-modal"
        role="alertdialog"
        showCloseButton={false}
        className={cn(
          "w-full max-w-[calc(100%-2rem)] sm:max-w-md md:max-w-lg",
          "rounded-2xl sm:rounded-3xl p-5 sm:p-6",
          "bg-background text-foreground dark:bg-card dark:text-card-foreground",
          "border border-border/80 dark:border-border/60 shadow-2xl",
          "transition-all duration-200 outline-none",
          className
        )}
      >
        <div className="flex flex-col gap-4 sm:gap-5">
          {/* Header Row */}
          <div className="flex items-start gap-3.5 sm:gap-4">
            <div
              className={cn(
                "flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl",
                "bg-destructive/10 text-destructive border border-destructive/20",
                "dark:bg-destructive/20 dark:border-destructive/30"
              )}
              aria-hidden="true"
            >
              <AlertTriangle className="size-5 sm:size-6" />
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <DialogHeader className="p-0 text-left">
                <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground dark:text-foreground">
                  {computedTitle}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                  {description || (
                    <>
                      This action is permanent and cannot be undone.{" "}
                      {itemName && (
                        <span>
                          Are you sure you want to permanently delete{" "}
                          <span className="font-semibold text-foreground dark:text-foreground">
                            {itemName}
                          </span>
                          ?
                        </span>
                      )}
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Quick close button in top corner */}
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              aria-label="Close dialog"
              className={cn(
                "absolute top-4 right-4 rounded-full p-1.5",
                "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                "dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-muted/40",
                "transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
              )}
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Verification input field if required */}
          {requireVerification && (
            <div className="space-y-2 rounded-xl bg-muted/40 dark:bg-muted/20 p-3.5 border border-border/60">
              <label
                htmlFor="verification-input"
                className="block text-xs font-medium text-foreground dark:text-foreground"
              >
                Please type{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground border border-border">
                  {targetKeyword}
                </code>{" "}
                to confirm:
              </label>
              <Input
                id="verification-input"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={verificationInput}
                onChange={(e) => setVerificationInput(e.target.value)}
                placeholder={
                  verificationPlaceholder || `Type "${targetKeyword}"`
                }
                disabled={isPending}
                className={cn(
                  "h-9 text-sm bg-background dark:bg-card border-border",
                  "focus-visible:ring-destructive/40 focus-visible:border-destructive"
                )}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    isVerificationSatisfied &&
                    !isPending
                  ) {
                    e.preventDefault();
                    handleConfirmAction();
                  }
                }}
              />
            </div>
          )}

          {/* Error alert message */}
          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg bg-destructive/15 border border-destructive/30 p-2.5 text-xs text-destructive dark:text-rose-400"
            >
              {errorMessage}
            </div>
          )}

          {/* Actions / Footer */}
          <DialogFooter className="mt-2 pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3 p-0">
            <Button
              ref={cancelButtonRef}
              type="button"
              variant="outline"
              size="default"
              onClick={handleClose}
              disabled={isPending}
              className={cn(
                "w-full sm:w-auto min-w-[5.5rem] justify-center cursor-pointer",
                "border-border hover:bg-muted dark:border-border dark:hover:bg-muted/50"
              )}
            >
              {cancelText}
            </Button>

            <Button
              type="button"
              variant={isDestructive ? "destructive" : "default"}
              size="default"
              onClick={handleConfirmAction}
              disabled={!isVerificationSatisfied || isPending}
              className={cn(
                "w-full sm:w-auto min-w-[6rem] justify-center cursor-pointer",
                isDestructive &&
                  "bg-destructive hover:bg-destructive/90 text-destructive-foreground dark:bg-rose-600 dark:hover:bg-rose-700 dark:text-white"
              )}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="size-4 mr-1.5" />
                  <span>{confirmText}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmDeleteModal;
