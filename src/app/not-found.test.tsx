import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import NotFound, {
  FIVE_MINUTES_IN_SECONDS,
  SessionInactivityWarningDialog,
} from "./not-found";

describe("SessionInactivityWarningDialog & NotFound (#6162)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("displays the 5-minute inactivity warning dialog and stays logged in when button is clicked", () => {
    const onStayLoggedIn = vi.fn();

    render(
      <SessionInactivityWarningDialog
        isAuthenticated
        remainingSeconds={FIVE_MINUTES_IN_SECONDS}
        onStayLoggedIn={onStayLoggedIn}
      />,
    );

    const dialog = screen.getByTestId("session-inactivity-dialog");
    expect(dialog).toBeTruthy();
    expect(screen.getByTestId("session-countdown").textContent).toBe("05:00");

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByTestId("session-countdown").textContent).toBe("04:57");

    fireEvent.click(screen.getByTestId("stay-logged-in-button"));
    expect(onStayLoggedIn).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("session-countdown").textContent).toBe("05:00");
  });

  it("does not display warning dialog when user is not authenticated", () => {
    render(
      <SessionInactivityWarningDialog
        isAuthenticated={false}
        remainingSeconds={FIVE_MINUTES_IN_SECONDS}
      />,
    );

    expect(screen.queryByTestId("session-inactivity-dialog")).toBeNull();
  });

  it("renders NotFound fallback cleanly", () => {
    render(<NotFound />);
    expect(screen.getByText("Page Not Found")).toBeTruthy();
  });
});
