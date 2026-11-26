import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import {
  ACCESSIBLE_STORAGE_KEY,
  ACCESSIBLE_THEME_PALETTES,
  AccessibleThemeMode,
  computeWcagContrastRatio,
  cycleFocusWithoutTrap,
} from "./theme-provider";
import { AccessibleHolographicTheme } from "./accessible-holographic-theme";

describe("AccessibleHolographicTheme & AccessibleThemeEngine (WCAG 2.2 AAA, Colorblind Shapes, Bionic & Focus)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("enforces >=7:1 normal contrast and >=4.5:1 large contrast across all 4 accessibility modes", () => {
    for (const mode of Object.keys(ACCESSIBLE_THEME_PALETTES) as AccessibleThemeMode[]) {
      const pal = ACCESSIBLE_THEME_PALETTES[mode];
      const normalRatio = computeWcagContrastRatio(pal.backgroundHex, pal.foregroundHex);
      const largeRatio = computeWcagContrastRatio(pal.backgroundHex, pal.largeTextHex);

      expect(normalRatio).toBeGreaterThanOrEqual(7);
      expect(largeRatio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("switches modes and Bionic Reading with zero reload, persists in localStorage, and renders Checkmark vs Cross in colorblind modes", () => {
    render(<AccessibleHolographicTheme />);

    const shell = screen.getByTestId("accessible-holographic-theme-shell");
    expect(shell.getAttribute("data-wcag-aaa-compliant")).toBe("true");

    // Toggle Bionic Reading ON
    fireEvent.click(screen.getByTestId("toggle-bionic-reading-btn"));
    expect(screen.getByTestId("bionic-comment-box").getAttribute("data-bionic-active")).toBe(
      "true",
    );
    expect(screen.getByTestId("bionic-comment-text").querySelectorAll("strong.bionic-word-lead").length).toBeGreaterThan(
      0,
    );

    // Switch to Deuteranopia / Protanopia mode -> Checkmark vs Cross geometric shapes replace plain dots
    fireEvent.click(screen.getByTestId("theme-mode-colorblind-deuteranopia-protanopia"));
    expect(shell.getAttribute("data-theme-mode")).toBe("colorblind-deuteranopia-protanopia");
    expect(screen.getByTestId("shape-check-test-1")).toBeTruthy();
    expect(screen.getByTestId("shape-cross-test-2")).toBeTruthy();

    // Switch to OpenDyslexic mode -> OpenDyslexic typography & localStorage persistence
    fireEvent.click(screen.getByTestId("theme-mode-opendyslexic-reading"));
    expect(screen.getByTestId("monaco-font-spec").textContent).toContain("OpenDyslexic");

    const stored = JSON.parse(window.localStorage.getItem(ACCESSIBLE_STORAGE_KEY) || "{}");
    expect(stored.mode).toBe("opendyslexic-reading");
    expect(stored.bionicReadingEnabled).toBe(true);
  });

  it("cycles focus cleanly across interactive controls without trapping keyboard focus", () => {
    render(<AccessibleHolographicTheme />);
    const shell = screen.getByTestId("accessible-holographic-theme-shell");
    const firstBtn = screen.getByTestId("toggle-bionic-reading-btn");
    firstBtn.focus();

    const secondEl = cycleFocusWithoutTrap(shell, firstBtn, false);
    expect(secondEl).toBeTruthy();
    expect(secondEl).not.toBe(firstBtn);
    expect(document.activeElement).toBe(secondEl);
  });
});
